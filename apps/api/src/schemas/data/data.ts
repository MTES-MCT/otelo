import { z } from 'zod'

export const ZData = z.object({
  b11: z.object({
    habitat_fortune: z.object({
      rp: z.number(),
      sne: z.object({
        camping: z.number(),
        squat: z.number(),
      }),
    }),
    hebergement: z.object({
      finess: z.object({
        aire_nomade: z.number(),
        autre_centre: z.number(),
        centre_provisoire: z.number(),
        demande_asile: z.number(),
        foyer: z.number(),
        hors_maison_relai: z.number(),
        jeune_travailleur: z.number(),
        maison_relai: z.number(),
        malade: z.number(),
        reinsertion: z.number(),
      }),
    }),
    hotel: z.object({
      rp: z.number(),
      sne: z.number(),
    }),
    sans_abri: z.object({
      rp: z.number(),
      sne: z.number(),
    }),
  }),
  b12: z.object({
    cohab_hors_interg: z.object({
      sne: z.object({
        gratuit: z.number(),
        particulier: z.number(),
        temp: z.number(),
      }),
    }),
    cohab_interg: z.object({
      filocom: z.number(),
    }),
  }),
  b13: z.object({
    inad_financ: z.object({
      cnaf: z.record(z.string(), z.number()),
    }),
  }),
  b14: z.object({
    mv_quali: z.object({
      ff: z.record(z.string(), z.number()),
      filocom: z.object({
        pppi_lp: z.number(),
        pppi_po: z.number(),
      }),
      rp: z.object({
        sani_chfl_loc_nonHLM: z.number(),
        sani_chfl_ppT: z.number(),
        sani_loc_nonHLM: z.number(),
        sani_ppT: z.number(),
      }),
    }),
  }),
  b15: z.object({
    inad_phys: z.object({
      filo: z.object({
        surocc_leg_lp: z.number(),
        surocc_leg_po: z.number(),
        surocc_lourde_lp: z.number(),
        surocc_lourde_po: z.number(),
      }),
      rp: z.object({
        nb_men_acc_loc_nonHLM: z.number(),
        nb_men_acc_ppT: z.number(),
        nb_men_mod_loc_nonHLM: z.number(),
        nb_men_mod_ppT: z.number(),
      }),
    }),
  }),
  b17: z.object({
    parc_social: z.object({
      sne: z.object({
        crea: z.number(),
        crea_mater: z.number(),
        crea_motifs: z.number(),
        crea_services: z.number(),
        crea_voisin: z.number(),
      }),
    }),
  }),
  b21: z.object({
    evol_demo: z.object({
      omphale: z.record(z.string(), z.number()),
    }),
  }),
  b22: z.object({
    evol_parc: z.object({
      filocom: z.object({
        parctot: z.number(),
        parctot_ant: z.number(),
        txdisp_parctot: z.number(),
        txlv_parctot: z.number(),
        txlv_parctot_ant: z.number(),
        txrest_parctot: z.number(),
        txrp_parctot: z.number(),
        txrp_parctot_ant: z.number(),
        txrs_parctot: z.number(),
        txrs_parctot_ant: z.number(),
      }),
    }),
  }),
})

export type TData = z.infer<typeof ZData>
