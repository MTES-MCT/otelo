import { createWriteStream } from 'node:fs'
import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'

export interface ScalingoBackup {
  id: string
  database_id: string
  created_at: string
  name: string
  size: number
  status: 'done' | 'pending' | 'error'
  method: 'periodic' | 'manual'
}

export interface ScalingoBackupsResponse {
  database_backups: ScalingoBackup[]
}

export interface ScalingoArchiveResponse {
  download_url: string
}

export interface ScalingoAddonTokenResponse {
  addon: {
    token: string
  }
}

export interface ScalingoTokenExchangeResponse {
  token: string
}

@Injectable()
export class ScalingoBackupService {
  private addonToken: string | null = null
  private bearerToken: string | null = null

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  private getMainApiUrl() {
    const region = this.configService.get<string>('SCALINGO_REGION')
    if (!region) {
      throw new Error('SCALINGO_REGION is not defined in environment variables')
    }
    return `https://api.${region}.scalingo.com`
  }

  private getDbApiUrl() {
    const apiUrl = this.configService.get<string>('SCALINGO_DB_API_URL')
    if (!apiUrl) {
      throw new Error('SCALINGO_DB_API_URL is not defined in environment variables')
    }
    return apiUrl
  }

  private getApiToken() {
    const token = this.configService.get<string>('SCALINGO_API_TOKEN')
    if (!token) {
      throw new Error('SCALINGO_API_TOKEN is not defined in environment variables')
    }
    return token
  }

  private getAppName() {
    const appName = this.configService.get<string>('SCALINGO_APP_NAME')
    if (!appName) {
      throw new Error('SCALINGO_APP_NAME is not defined in environment variables')
    }
    return appName
  }

  private getAddonId() {
    const addonId = this.configService.get<string>('SCALINGO_ADDON_ID')
    if (!addonId) {
      throw new Error('SCALINGO_ADDON_ID is not defined in environment variables')
    }
    return addonId
  }

  /**
   * Exchange API token for a bearer token
   * This is the first step of Scalingo authentication
   */
  private async exchangeApiToken(): Promise<string> {
    if (this.bearerToken) {
      return this.bearerToken
    }

    const apiToken = this.getApiToken()
    const url = 'https://auth.scalingo.com/v1/tokens/exchange'

    const response = await firstValueFrom(
      this.httpService.post<ScalingoTokenExchangeResponse>(
        url,
        {},
        {
          auth: {
            username: '',
            password: apiToken,
          },
        },
      ),
    )

    this.bearerToken = response.data.token
    return this.bearerToken
  }

  /**
   * Get addon-specific token from main Scalingo API
   * This token is required to authenticate against the Database API
   */
  private async getAddonToken(): Promise<string> {
    if (this.addonToken) {
      return this.addonToken
    }

    const bearerToken = await this.exchangeApiToken()
    const mainApiUrl = this.getMainApiUrl()
    const appName = this.getAppName()
    const addonId = this.getAddonId()

    const url = `${mainApiUrl}/v1/apps/${appName}/addons/${addonId}/token`

    const response = await firstValueFrom(
      this.httpService.post<ScalingoAddonTokenResponse>(
        url,
        {},
        {
          headers: {
            Authorization: `Bearer ${bearerToken}`,
          },
        },
      ),
    )

    this.addonToken = response.data.addon.token
    return this.addonToken
  }

  private async getDbAuthHeaders() {
    const token = await this.getAddonToken()
    return {
      Authorization: `Bearer ${token}`,
    }
  }

  async listBackups(): Promise<ScalingoBackup[]> {
    const apiUrl = this.getDbApiUrl()
    const dbId = this.getAddonId()
    const headers = await this.getDbAuthHeaders()

    const url = `${apiUrl}/api/databases/${dbId}/backups`

    const response = await firstValueFrom(this.httpService.get<ScalingoBackupsResponse>(url, { headers }))

    return response.data.database_backups
  }

  async getLatestBackup(): Promise<ScalingoBackup> {
    const backups = await this.listBackups()

    // Filter only successful backups
    const doneBackups = backups.filter((backup) => backup.status === 'done')

    if (doneBackups.length === 0) {
      throw new Error('No completed backups found')
    }

    // Sort by creation date descending (most recent first)
    doneBackups.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return doneBackups[0]
  }

  async getDownloadUrl(backupId: string): Promise<string> {
    const apiUrl = this.getDbApiUrl()
    const dbId = this.getAddonId()
    const headers = await this.getDbAuthHeaders()

    const url = `${apiUrl}/api/databases/${dbId}/backups/${backupId}/archive`

    const response = await firstValueFrom(this.httpService.get<ScalingoArchiveResponse>(url, { headers }))

    return response.data.download_url
  }

  async downloadBackup(downloadUrl: string, outputPath: string): Promise<void> {
    const response = await firstValueFrom(
      this.httpService.get<NodeJS.ReadableStream>(downloadUrl, {
        responseType: 'stream',
      }),
    )

    const writeStream = createWriteStream(outputPath)
    response.data.pipe(writeStream)

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => resolve())
      writeStream.on('error', reject)
    })
  }
}
