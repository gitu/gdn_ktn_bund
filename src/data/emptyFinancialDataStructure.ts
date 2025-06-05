import type { FinancialData, FinancialDataNode } from '../types/FinancialDataStructure';

/**
 * Creates an empty FinancialData structure with hierarchical trees
 * populated from code definitions but with empty values.
 *
 * This structure includes:
 * - Balance sheet tree from bilanz/fs.csv
 * - Income statement tree combining ertrag/fs.csv and aufwand/fs.csv
 * - Empty arrays for usedCodes and unusedCodes
 * - Empty Map for entities
 */
export function createEmptyFinancialDataStructure(): FinancialData {
  return {
  "balanceSheet": {
    "code": "root",
    "labels": {
      "de": "Gesamt",
      "fr": "Total",
      "it": "Totale",
      "en": "Total"
    },
    "values": new Map(),
    "children": [
      {
        "code": "1",
        "labels": {
          "de": "Aktiven",
          "fr": "Actif",
          "it": "Attivi",
          "en": "Assets"
        },
        "values": new Map(),
        "children": [
          {
            "code": "10",
            "labels": {
              "de": "Finanzvermögen",
              "fr": "Patrimoine financier",
              "it": "Beni patrimoniali",
              "en": "Non-administrative assets"
            },
            "values": new Map(),
            "children": [
              {
                "code": "100",
                "labels": {
                  "de": "Flüssige Mittel und kurzfristige Geldanlagen",
                  "fr": "Liquidités et placements à court terme",
                  "it": "Liquidità e investimenti di denaro a breve termine",
                  "en": "Cash and cash equivalents"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "101",
                "labels": {
                  "de": "Forderungen",
                  "fr": "Créances",
                  "it": "Crediti",
                  "en": "Receivables"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "102",
                "labels": {
                  "de": "Kurzfristige Finanzanlagen",
                  "fr": "Placements financiers à court terme",
                  "it": "Investimenti finanziari a breve termine",
                  "en": "Short-term financial investments"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "104",
                "labels": {
                  "de": "Aktive Rechnungsabgrenzungen",
                  "fr": "Comptes de régularisation actifs",
                  "it": "Delimitazioni contabili attive",
                  "en": "Prepaid expenses and accrued income"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "106",
                "labels": {
                  "de": "Vorräte und angefangene Arbeiten",
                  "fr": "Stocks et travaux en cours",
                  "it": "Scorte e lavori in corso",
                  "en": "Inventories and work in progress"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "107",
                "labels": {
                  "de": "Langfristige Finanzanlagen",
                  "fr": "Placements financiers à long terme",
                  "it": "Investimenti finanziari a lungo termine",
                  "en": "Long-term financial investments"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "108",
                "labels": {
                  "de": "Sachanlagen, FV",
                  "fr": "Immobilisations corporelles, PF",
                  "it": "Investimenti materiali, beni patrimoniali",
                  "en": "Tangible fixed assets, NAA"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "109",
                "labels": {
                  "de": "Forderungen gegenüber Spezialfinanzierungen und Fonds im Fremdkapital",
                  "fr": "Créances sur les financements spéciaux et fonds enregistrés sous les capitaux de tiers",
                  "it": "Crediti nei confronti di finanziamenti speciali e di fondi nel capitale di terzi",
                  "en": "Receivables from special financing and funds in liabilities"
                },
                "values": new Map(),
                "children": []
              }
            ]
          },
          {
            "code": "14",
            "labels": {
              "de": "Verwaltungsvermögen",
              "fr": "Patrimoine administratif",
              "it": "Beni amministrativi",
              "en": "Administrative assets"
            },
            "values": new Map(),
            "children": [
              {
                "code": "140",
                "labels": {
                  "de": "Sachanlagen, VV",
                  "fr": "Immobilisations corporelles, PA",
                  "it": "Investimenti materiali, beni amministrativi",
                  "en": "Tangible fixed assets, AA"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "141",
                "labels": {
                  "de": "Vorräte, VV",
                  "fr": "Stocks, PA",
                  "it": "Scorte, beni amministrativi",
                  "en": "Inventories, AA"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "142",
                "labels": {
                  "de": "Immaterielle Anlagen",
                  "fr": "Immobilisations incorporelles",
                  "it": "Investimenti immateriali",
                  "en": "Intangible fixed assets"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "143",
                "labels": {
                  "de": "Darlehen und Beteiligungen n.a.g.",
                  "fr": "Prêts et participations n.c.a.",
                  "it": "Mutui e partecipazioni n.m.a.",
                  "en": "Loans and financial interests n.e.c."
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "144",
                "labels": {
                  "de": "Darlehen",
                  "fr": "Prêts",
                  "it": "Mutui",
                  "en": "Loans"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "145",
                "labels": {
                  "de": "Beteiligungen, Grundkapitalien",
                  "fr": "Participations, capital social",
                  "it": "Partecipazioni, capitali sociali",
                  "en": "Financial interests, share capital"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "146",
                "labels": {
                  "de": "Investitionsbeiträge",
                  "fr": "Contributions à des investissements",
                  "it": "Contributi agli investimenti",
                  "en": "Investment contributions"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "147",
                "labels": {
                  "de": "Guthaben gegenüber öffentlichen Haushalten",
                  "fr": "Créances sur les administrations publiques",
                  "it": "Averi verso le amministrazioni pubbliche",
                  "en": "Assets due from government units"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "148",
                "labels": {
                  "de": "Kumulierte zusätzliche Abschreibungen",
                  "fr": "Amortissements supplémentaires cumulés",
                  "it": "Ammortamenti supplementari cumulati",
                  "en": "Accumulated additional depreciation and amortization"
                },
                "values": new Map(),
                "children": []
              }
            ]
          }
        ]
      },
      {
        "code": "2",
        "labels": {
          "de": "Passiven",
          "fr": "Passif",
          "it": "Passivi",
          "en": "Liabilities and equity"
        },
        "values": new Map(),
        "children": [
          {
            "code": "20",
            "labels": {
              "de": "Fremdkapital",
              "fr": "Capitaux de tiers",
              "it": "Capitale di terzi",
              "en": "Liabilities"
            },
            "values": new Map(),
            "children": [
              {
                "code": "200",
                "labels": {
                  "de": "Laufende Verbindlichkeiten",
                  "fr": "Engagements courants",
                  "it": "Impegni correnti",
                  "en": "Current liabilities"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "201",
                "labels": {
                  "de": "Kurzfristige Finanzverbindlichkeiten",
                  "fr": "Engagements financiers à court terme",
                  "it": "Impegni finanziari a breve termine",
                  "en": "Short-term financial liabilities"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "204",
                "labels": {
                  "de": "Passive Rechnungsabgrenzungen",
                  "fr": "Comptes de régularisation passifs",
                  "it": "Delimitazioni contabili passive",
                  "en": "Accrued expenses and deferred income"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "205",
                "labels": {
                  "de": "Kurzfristige Rückstellungen",
                  "fr": "Provisions à court terme",
                  "it": "Accantonamenti a breve termine",
                  "en": "Short-term provisions"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "206",
                "labels": {
                  "de": "Langfristige Finanzverbindlichkeiten",
                  "fr": "Engagements financiers à long terme",
                  "it": "Impegni a lungo termine",
                  "en": "Long-term financial liabilities"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "207",
                "labels": {
                  "de": "Verbindlichkeiten gegenüber öffentlichen Haushalten",
                  "fr": "Engagements envers les administrations publiques",
                  "it": "Impegni nei confronti delle amministrazioni pubbliche",
                  "en": "Liabilities toward government units"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "208",
                "labels": {
                  "de": "Langfristige Rückstellungen",
                  "fr": "Provisions à long terme",
                  "it": "Accantonamenti a lungo termine",
                  "en": "Long-term provisions"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "209",
                "labels": {
                  "de": "Zweckgebundene Mittel/Fonds",
                  "fr": "Fonds affectés",
                  "it": "Mezzi/Fondi a destinazione vincolata",
                  "en": "Restricted funds"
                },
                "values": new Map(),
                "children": []
              }
            ]
          },
          {
            "code": "29",
            "labels": {
              "de": "Eigenkapital",
              "fr": "Capital propre",
              "it": "Capitale proprio",
              "en": "Net assets/equity"
            },
            "values": new Map(),
            "children": [
              {
                "code": "290",
                "labels": {
                  "de": "Spezialfinanzierungen und Fonds und Eigenkapital",
                  "fr": "Financements spéciaux et fonds enregistrés sous le capital propre",
                  "it": "Finanziamenti speciali e di fondi nel capitale proprio",
                  "en": "Special financing and funds in net assets/equity"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "292",
                "labels": {
                  "de": "Rücklagen der Globalbudgetbereiche",
                  "fr": "Réserves des domaines de l'enveloppe budgétaire",
                  "it": "Riserve dei settori del preventivo globale",
                  "en": "Global budget area reserves"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "293",
                "labels": {
                  "de": "Vorfinanzierungen",
                  "fr": "Préfinancements",
                  "it": "Prefinanziamenti",
                  "en": "Advance financing"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "294",
                "labels": {
                  "de": "Finanzpolitische Reserven",
                  "fr": "Réserves de politique budgétaire",
                  "it": "Riserve di politica finanziaria",
                  "en": "Fiscal policy reserves"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "295",
                "labels": {
                  "de": "Aufwertungsreserve",
                  "fr": "Réserve liée au retraitement",
                  "it": "Riserva di rivalutazione",
                  "en": "Restatement reserve"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "296",
                "labels": {
                  "de": "Neubewertungsreserve Finanzvermögen",
                  "fr": "Réserve liée à la réévaluation du patrimoine financier",
                  "it": "Riserva di nuova valutazione dei beni patrimoniali",
                  "en": "Revaluation reserve, non-administrative assets"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "298",
                "labels": {
                  "de": "Übriges Eigenkapital",
                  "fr": "Autre capital propre",
                  "it": "Rimanente capitale proprio",
                  "en": "Other net assets/equity"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "299",
                "labels": {
                  "de": "Bilanzüberschuss/-fehlbetrag",
                  "fr": "Excédent/découvert du bilan",
                  "it": "Eccedenza/Disavanzo di bilancio",
                  "en": "Accumulated surplus/deficit"
                },
                "values": new Map(),
                "children": []
              }
            ]
          }
        ]
      }
    ]
  },
  "incomeStatement": {
    "code": "root",
    "labels": {
      "de": "Erfolgsrechnung",
      "fr": "Compte de résultats",
      "it": "Conto economico",
      "en": "Income Statement"
    },
    "values": new Map(),
    "children": [
      {
        "code": "3",
        "labels": {
          "de": "Aufwand",
          "fr": "Charges",
          "it": "Spese",
          "en": "Expenses"
        },
        "values": new Map(),
        "children": [
          {
            "code": "30",
            "labels": {
              "de": "Personalaufwand",
              "fr": "Charges de personnel",
              "it": "Spese per il personale",
              "en": "Personnel expenses"
            },
            "values": new Map(),
            "children": [
              {
                "code": "300",
                "labels": {
                  "de": "Behörden, Kommissionen und Richter",
                  "fr": "Autorités, commissions et juges",
                  "it": "Autorità, commissioni e giudici",
                  "en": "Authorities, commissions and judges"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "301",
                "labels": {
                  "de": "Löhne des Verwaltungs- und Betriebspersonals",
                  "fr": "Salaires du personnel administratif et d'exploitation",
                  "it": "Stipendi del personale amministrativo e d'esercizio",
                  "en": "Salaries of administrative and operating personnel"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "302",
                "labels": {
                  "de": "Löhne der Lehrpersonen",
                  "fr": "Salaires des enseignants",
                  "it": "Stipendi del corpo docenti",
                  "en": "Salaries of teaching staff"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "303",
                "labels": {
                  "de": "Temporäre Arbeitskräfte",
                  "fr": "Travailleurs temporaires",
                  "it": "Personale temporaneo",
                  "en": "Temporary staff"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "304",
                "labels": {
                  "de": "Zulagen",
                  "fr": "Allocations",
                  "it": "Assegni e indennità",
                  "en": "Allowances"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "305",
                "labels": {
                  "de": "Arbeitgeberbeiträge",
                  "fr": "Cotisations de l'employeur",
                  "it": "Contributi del datore di lavoro",
                  "en": "Employer contributions"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "306",
                "labels": {
                  "de": "Arbeitgeberleistungen",
                  "fr": "Prestations de l'employeur",
                  "it": "Prestazioni del datore di lavoro",
                  "en": "Employer benefits"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "309",
                "labels": {
                  "de": "Übriger Personalaufwand",
                  "fr": "Autres charges de personnel",
                  "it": "Rimanenti spese per il personale",
                  "en": "Other personnel expenses"
                },
                "values": new Map(),
                "children": []
              }
            ]
          },
          {
            "code": "31",
            "labels": {
              "de": "Sach- und übriger Betriebsaufwand",
              "fr": "Charges de biens et services et autres charges d'exploitation",
              "it": "Spese per beni e servizi e altre spese d’esercizio",
              "en": "General, administrative and operating expenses"
            },
            "values": new Map(),
            "children": [
              {
                "code": "310",
                "labels": {
                  "de": "Material- und Warenaufwand",
                  "fr": "Charges de matériel et de marchandises",
                  "it": "Spese per materiale e merci",
                  "en": "Cost of goods and materials"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "311",
                "labels": {
                  "de": "Nicht aktivierbare Anlagen",
                  "fr": "Immobilisations non portées à l'actif",
                  "it": "Investimenti non attivabili",
                  "en": "Non-capitalized assets"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "312",
                "labels": {
                  "de": "Ver- und Entsorgung Liegenschaften VV",
                  "fr": "Approvisionnement et élimination",
                  "it": "Approvvigionamento e smaltimento di immobili beni amministrativi",
                  "en": "Supply and disposal"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "313",
                "labels": {
                  "de": "Dienstleistungen und Honorare",
                  "fr": "Prestations de service et honoraires",
                  "it": "Prestazioni di servizi e onorari",
                  "en": "Services and fees"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "314",
                "labels": {
                  "de": "Baulicher und betrieblicher Unterhalt",
                  "fr": "Travaux d'entretien",
                  "it": "Manutenzione edile e d'esercizio",
                  "en": "Building maintenance"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "315",
                "labels": {
                  "de": "Unterhalt Mobilien und immaterielle Anlagen",
                  "fr": "Entretien des biens meubles et immobilisations incorporelles",
                  "it": "Manutenzione di beni mobili e investimenti immateriali",
                  "en": "Upkeep of movables and intangible fixed assets"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "316",
                "labels": {
                  "de": "Mieten, Leasing, Pachten, Benützungsgebühren",
                  "fr": "Loyers, leasing, fermages, émoluments d'utilisation",
                  "it": "Pigioni, leasing, fitti, emolumenti di utilizzazione",
                  "en": "Rental, lease, tenancy, user charges"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "317",
                "labels": {
                  "de": "Spesenentschädigungen",
                  "fr": "Remboursement des frais",
                  "it": "Indennità per il rimborso spese",
                  "en": "Compensation for expenses"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "318",
                "labels": {
                  "de": "Wertberichtigungen auf Forderungen",
                  "fr": "Réévaluation de créances",
                  "it": "Rettificazioni di valore su crediti",
                  "en": "Value adjustments on receivables"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "319",
                "labels": {
                  "de": "Übriger Betriebsaufwand",
                  "fr": "Autres charges d'exploitation",
                  "it": "Rimanenti spese d'esercizio",
                  "en": "Other operating expenses"
                },
                "values": new Map(),
                "children": []
              }
            ]
          },
          {
            "code": "32",
            "labels": {
              "de": "Rüstungsaufwand",
              "fr": "Charges d'armement",
              "it": "Spese per l'armamento",
              "en": "Defense expenses"
            },
            "values": new Map(),
            "children": [
              {
                "code": "320",
                "labels": {
                  "de": "Rüstungsaufwand",
                  "fr": "Charges d'armement",
                  "it": "Spese per l'armamento",
                  "en": "Defense expenses"
                },
                "values": new Map(),
                "children": []
              }
            ]
          },
          {
            "code": "33",
            "labels": {
              "de": "Abschreibungen auf das Verwaltungsvermögen",
              "fr": "Amortissement du patrimoine administratif",
              "it": "Ammortamenti sui beni amministrativi",
              "en": "Depreciation, administrative assets"
            },
            "values": new Map(),
            "children": [
              {
                "code": "331",
                "labels": {
                  "de": "Abschreibungen n.a.g.",
                  "fr": "Amortissements n.c.a.",
                  "it": "Ammortamenti n.m.a.",
                  "en": "Depreciation and amortization n.e.c."
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "337",
                "labels": {
                  "de": "Planmässige Abschreibungen",
                  "fr": "Amortissements planifiés",
                  "it": "Ammortamenti pianificati",
                  "en": "Planned depreciation and amortization"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "338",
                "labels": {
                  "de": "Ausserplanmässige Abschreibungen",
                  "fr": "Amortissements non planifiés",
                  "it": "Ammortamenti non pianificati",
                  "en": "Unplanned depreciation and amortization"
                },
                "values": new Map(),
                "children": []
              }
            ]
          },
          {
            "code": "34",
            "labels": {
              "de": "Finanzaufwand",
              "fr": "Charges financières",
              "it": "Spese finanziarie",
              "en": "Financial expense"
            },
            "values": new Map(),
            "children": [
              {
                "code": "340",
                "labels": {
                  "de": "Zinsaufwand",
                  "fr": "Charges d'intérêts",
                  "it": "Spese a titolo di interessi",
                  "en": "Interest expense"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "341",
                "labels": {
                  "de": "Realisierte Verluste FV",
                  "fr": "Pertes réalisées PF",
                  "it": "Perdite conseguite beni patrimoniali",
                  "en": "Realized losses NAA"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "342",
                "labels": {
                  "de": "Kapitalbeschaffung und -verwaltung",
                  "fr": "Acquisition et administration de capital",
                  "it": "Raccolta e gestione di capitale",
                  "en": "Capital procurement and administration"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "343",
                "labels": {
                  "de": "Liegenschaftenaufwand, FV",
                  "fr": "Charges d'immeubles, PF",
                  "it": "Spese per immobili, beni patrimoniali",
                  "en": "Real estate expense, NAA"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "344",
                "labels": {
                  "de": "Wertberichtigungen Anlagen, FV",
                  "fr": "Réévaluation d'immobilisations, PF",
                  "it": "Rettificazioni di valore su investimenti, beni patrimoniali",
                  "en": "Value adjustments on investments, NAA"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "349",
                "labels": {
                  "de": "Übriger Finanzaufwand",
                  "fr": "Autres charges financières",
                  "it": "Rimanenti spese finanziarie",
                  "en": "Other financial expense"
                },
                "values": new Map(),
                "children": []
              }
            ]
          },
          {
            "code": "35",
            "labels": {
              "de": "Einlagen in Fonds und Spezialfinanzierungen",
              "fr": "Apports aux fonds et financements spéciaux",
              "it": "Versamenti a fondi e a finanziamenti speciali",
              "en": "Net expense for funds and special financing"
            },
            "values": new Map(),
            "children": [
              {
                "code": "350",
                "labels": {
                  "de": "Einlagen in Fonds und Spezialfinanzierungen im Fremdkapital",
                  "fr": "Apports aux fonds et financements spéciaux enregistrés sous capitaux de tiers",
                  "it": "Versamenti a fondi e a finanziamenti speciali nel capitale di terzi",
                  "en": "Net expense for funds and special financing in liabilities"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "351",
                "labels": {
                  "de": "Einlagen in Fonds und Spezialfinanzierungen im Eigenkapital",
                  "fr": "Apports aux fonds et financements spéciaux enregistrés sous le capital propre",
                  "it": "Versamenti a fondi e a finanziamenti speciali nel capitale proprio",
                  "en": "Net expense for funds and special financing in net assets/equity"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "352",
                "labels": {
                  "de": "Einlagen in Fonds und Spezialfinanzierungen n.a.g.",
                  "fr": "Apports aux fonds et financements spéciaux n.c.a.",
                  "it": "Versamenti a fondi e a finanziamenti speciali n.m.a.",
                  "en": "Net expense for funds and special financing n.e.c."
                },
                "values": new Map(),
                "children": []
              }
            ]
          },
          {
            "code": "36",
            "labels": {
              "de": "Transferaufwand",
              "fr": "Charges de transfert",
              "it": "Spese di riversamento",
              "en": "Transfer expenses"
            },
            "values": new Map(),
            "children": [
              {
                "code": "360",
                "labels": {
                  "de": "Ertragsanteile",
                  "fr": "Parts de revenus",
                  "it": "Partecipazioni a ricavi",
                  "en": "Revenue shares"
                },
                "values": new Map(),
                "children": [
                  {
                    "code": "3600",
                    "labels": {
                      "de": "Ertragsanteile an Bund",
                      "fr": "Parts de revenus destinées à la Confédération",
                      "it": "Partecipazioni della Confederazione a ricavi",
                      "en": "Revenue shares for the Confederation"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "3601",
                    "labels": {
                      "de": "Ertragsanteile an Kantone und Konkordate",
                      "fr": "Parts de revenus destinées aux cantons et aux concordats",
                      "it": "Partecipazioni di Cantoni e Concordati a ricavi",
                      "en": "Revenue shares for cantons and concordats"
                    },
                    "values": new Map(),
                    "children": [
                      {
                        "code": "36010",
                        "labels": {
                          "de": "Ertragsanteil direkte Bundessteuer",
                          "fr": "Part des revenus de l'impôt fédéral direct",
                          "it": "Partecipazioni a ricavi, imposta federale diretta",
                          "en": "Share in direct federal tax revenue"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "36011",
                        "labels": {
                          "de": "Ertragsanteil Verrechnungssteuer",
                          "fr": "Part des revenus de l'impôt anticipé",
                          "it": "Partecipazioni a ricavi, imposta preventiva",
                          "en": "Share in withholding tax revenue"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "36012",
                        "labels": {
                          "de": "Ertragsanteil Wehrpflichtersatzabgabe",
                          "fr": "Part des revenus de la taxe d'exemption de l'obligation de servir",
                          "it": "Partecipazioni a ricavi, tassa d'esenzione dall'obbligo militare",
                          "en": "Share in military service exemption tax revenue"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "36013",
                        "labels": {
                          "de": "Ertraganteil Eidg. Alkoholverwaltung",
                          "fr": "Part des revenus de la Régie fédérale des alcools",
                          "it": "Partecipazioni a ricavi, Regìa federale degli alcool",
                          "en": "Share in Swiss Alcohol Board revenue"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "36014",
                        "labels": {
                          "de": "Ertraganteil Eidg. Bussen und Taxen",
                          "fr": "Part des revenus des amendes et taxes fédérales",
                          "it": "Partecipazioni a ricavi, multe e tasse federali",
                          "en": "Share in revenue from federal fines and duties"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "36015",
                        "labels": {
                          "de": "Ertraganteil Eidg. Mineralölsteuer",
                          "fr": "Part des revenus de l'impôt fédéral sur les huiles minérales",
                          "it": "Partecipazioni a ricavi, imposta federale sugli oli minerali",
                          "en": "Share in federal mineral oil tax revenue"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "36016",
                        "labels": {
                          "de": "Ertraganteil Eidg. Stempelabgabe",
                          "fr": "Part des revenus des droits de timbre fédéraux",
                          "it": "Partecipazioni a ricavi, tasse di bollo federali",
                          "en": "Share in federal stamp duty revenue"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "36017",
                        "labels": {
                          "de": "Ertraganteil EU-Zinsbesteuerung",
                          "fr": "Part des revenus de la fiscalité de l'épargne UE",
                          "it": "Partecipazioni a ricavi, fiscalità del risparmio UE",
                          "en": "Share in EU savings tax revenue"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "36018",
                        "labels": {
                          "de": "Ertraganteil LSVA",
                          "fr": "Part des revenus de la RPLP",
                          "it": "Partecipazioni a ricavi, TTPCP",
                          "en": "Share in mileage-related heavy vehicle charge revenue"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "36019",
                        "labels": {
                          "de": "Ertraganteil übriger Bundeseinnahmen",
                          "fr": "Part des autres recettes de la Confédération",
                          "it": "Partecipazioni a ricavi, rimanenti entrate della Confederazione",
                          "en": "Share in revenue from other federal receipts"
                        },
                        "values": new Map(),
                        "children": []
                      }
                    ]
                  },
                  {
                    "code": "3602",
                    "labels": {
                      "de": "Ertragsanteile Gemeinden und Gemeindezweckverbände",
                      "fr": "Parts de revenus destinées aux communes et syndicats intercommunaux",
                      "it": "Partecipazioni di Comuni e consorzi comunali a ricavi",
                      "en": "Revenue shares for municipalities and special purpose entities"
                    },
                    "values": new Map(),
                    "children": [
                      {
                        "code": "36021",
                        "labels": {
                          "de": "Gemeindeanteile an kantonalen Steuern",
                          "fr": "Parts des impôts cantonaux revenant aux communes",
                          "it": "Partecipazioni di Comuni alle imposte cantonali",
                          "en": "Municipalities' share in cantonal taxes"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "36022",
                        "labels": {
                          "de": "Gemeindeanteile an Regalien und Konzessionen",
                          "fr": "Parts des patentes et concessions revenant aux communes",
                          "it": "Partecipazioni di Comuni a regalie e concessioni",
                          "en": "Municipalities' share in royalties and concessions"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "36023",
                        "labels": {
                          "de": "Gemeindeanteile an kantonalen Gebühren",
                          "fr": "Parts des émoluments cantonaux revenant aux communes",
                          "it": "Partecipazioni di Comuni a emolumenti cantonali",
                          "en": "Municipalities' share in cantonal fees"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "36029",
                        "labels": {
                          "de": "Gemeindeanteile an übrigen kantonalen Erträgen",
                          "fr": "Parts des autres revenus cantonaux revenant aux communes",
                          "it": "Partecipazioni di Comuni ai rimanenti ricavi cantonali",
                          "en": "Municipalities' share in other cantonal revenue"
                        },
                        "values": new Map(),
                        "children": []
                      }
                    ]
                  },
                  {
                    "code": "3603",
                    "labels": {
                      "de": "Ertragsanteile an öffentlichen Sozialversicherungen",
                      "fr": "Parts de revenus destinées aux assurances sociales publiques",
                      "it": "Partecipazioni di assicurazioni sociali pubbliche a ricavi",
                      "en": "Revenue shares for social security funds"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "3604",
                    "labels": {
                      "de": "Ertragsanteile an öffentlichen Unternehmen",
                      "fr": "Parts de revenus destinées aux entreprises publiques",
                      "it": "Partecipazioni di imprese pubbliche a ricavi",
                      "en": "Revenue shares for public corporations"
                    },
                    "values": new Map(),
                    "children": []
                  }
                ]
              },
              {
                "code": "361",
                "labels": {
                  "de": "Entschädigungen",
                  "fr": "Indemnités",
                  "it": "Indennizzi",
                  "en": "Compensation"
                },
                "values": new Map(),
                "children": [
                  {
                    "code": "3610",
                    "labels": {
                      "de": "Entschädigungen an Bund",
                      "fr": "Indemnités à la Confédération",
                      "it": "Indennizzi alla Confederazione",
                      "en": "Compensation for the Confederation"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "3611",
                    "labels": {
                      "de": "Entschädigungen an Kantone und Konkordate",
                      "fr": "Indemnités aux cantons et aux concordats",
                      "it": "Indennizzi a Cantoni e Concordati",
                      "en": "Compensation for cantons and concordats"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "3612",
                    "labels": {
                      "de": "Entschädigungen an Gemeinden und Gemeindezweckverbände",
                      "fr": "Indemnités aux communes et aux syndicats intercommunaux",
                      "it": "Indennizzi a Comuni e consorzi comunali",
                      "en": "Compensation for municipalities and special purpose entities"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "3613",
                    "labels": {
                      "de": "Entschädigungen an öffentliche Sozialversicherungen",
                      "fr": "Indemnités aux assurances sociales publiques",
                      "it": "Indennizzi ad assicurazioni sociali pubbliche",
                      "en": "Compensation for social security funds"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "3614",
                    "labels": {
                      "de": "Entschädigungen an öffentlichen Unternehmen",
                      "fr": "Indemnités aux entreprises publiques",
                      "it": "Indennizzi a imprese pubbliche",
                      "en": "Compensation for public corporations"
                    },
                    "values": new Map(),
                    "children": []
                  }
                ]
              },
              {
                "code": "362",
                "labels": {
                  "de": "Finanz- und Lastenausgleich",
                  "fr": "Péréquation financière et compensation des charges",
                  "it": "Perequazione finanziaria e compensazione degli oneri",
                  "en": "Fiscal equalization and cost compensation"
                },
                "values": new Map(),
                "children": [
                  {
                    "code": "3620",
                    "labels": {
                      "de": "Finanz- und Lastenausgleich an Bund",
                      "fr": "Péréquation financière et compensation des charges à la Confédération",
                      "it": "Perequazione finanziaria e compensazione degli oneri alla Confederazione",
                      "en": "Fiscal equalization and cost compensation for the Confederation"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "3621",
                    "labels": {
                      "de": "Finanz- und Lastenausgleich an Kantone",
                      "fr": "Péréquation financière et compensation des charges aux cantons",
                      "it": "Perequazione finanziaria e compensazione degli oneri a Cantoni e concordati",
                      "en": "Fiscal equalization and cost compensation for cantons"
                    },
                    "values": new Map(),
                    "children": [
                      {
                        "code": "36211",
                        "labels": {
                          "de": "Ressourcenausgleich",
                          "fr": "Péréquation des ressources",
                          "it": "Perequazione delle risorse",
                          "en": "Resource equalization"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "36212",
                        "labels": {
                          "de": "Sozio-demografischer Lastenausgleich",
                          "fr": "Compensation des charges excessives dues à des facteurs socio-démographiques",
                          "it": "Compensazione degli oneri eccessivi dovuti a fattori sociodemografici",
                          "en": "Socio-demographic cost compensation"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "36213",
                        "labels": {
                          "de": "Geografisch-topografischer Lastenausgleich",
                          "fr": "Compensation des charges excessives dues à des facteurs géo-topographiques",
                          "it": "Compensazione degli oneri eccessivi dovuti a fattori geotopografici",
                          "en": "Geographical/topographic cost compensation"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "36214",
                        "labels": {
                          "de": "Härteausgleich",
                          "fr": "Compensation des cas de rigueur",
                          "it": "Compensazione dei casi di rigore",
                          "en": "Cohesion fund"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "36215",
                        "labels": {
                          "de": "Vertikaler Finanzausgleich von Gemeinde an Kanton",
                          "fr": "Péréquation financière verticale des communes au canton",
                          "it": "Perequazione finanziaria verticale da Comuni a Cantone",
                          "en": "Vertical fiscal equalization between municipalities and cantons"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "36216",
                        "labels": {
                          "de": "Vertikaler Lastenausgleich von Gemeinde an Kanton",
                          "fr": "Compensation verticale des charges des communes au canton",
                          "it": "Compensazione verticale degli oneri da Comuni a Cantone",
                          "en": "Vertical cost compensation between municipalities and cantons"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "36217",
                        "labels": {
                          "de": "Weitergabe Ressourcen- und Härteausgleich der Geberkantone",
                          "fr": "Transmission de la péréquation des ressources et compensation des cas de rigueur des cantons contributeurs",
                          "it": "Trasferimento dai Cantoni donatori della perequazione delle risorse e compensazione dei casi di rigore",
                          "en": "Forwarding of resource equalization and cohesion fund from donor cantons"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "36219",
                        "labels": {
                          "de": "Übrige Massnahmen des Finanzausgleichs",
                          "fr": "Autres mesures liées à la péréquation financière",
                          "it": "Rimanenti misure della perequazione finanziaria",
                          "en": "Other measures of the fiscal equalization"
                        },
                        "values": new Map(),
                        "children": []
                      }
                    ]
                  },
                  {
                    "code": "3622",
                    "labels": {
                      "de": "Finanz- und Lastenausgleich an Gemeinden",
                      "fr": "Péréquation financière et compensation des charges aux communes",
                      "it": "Perequazione finanziaria e compensazione degli oneri a Comuni",
                      "en": "Fiscal equalization and cost compensation for municipalities"
                    },
                    "values": new Map(),
                    "children": [
                      {
                        "code": "36221",
                        "labels": {
                          "de": "Weitergabe eines Anteils am Ressourcenausgleich an Gemeinden",
                          "fr": "Transmission d'une part de la péréquation des ressources aux communes",
                          "it": "Trasferimento ai Comuni di una percentuale della perequazione delle risorse",
                          "en": "Forwarding of a share in resource equalization to municipalities"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "36222",
                        "labels": {
                          "de": "Weitergabe eines Anteils am sozio-demografischen Ausgleich an Gemeinden",
                          "fr": "Transmission d'une part de la compensation des charges excessives dues à des facteurs socio-démographiques aux communes",
                          "it": "Trasferimento ai Comuni di una percentuale della perequazione sociodemografica",
                          "en": "Forwarding of a share in socio-demographic equalization to municipalities"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "36223",
                        "labels": {
                          "de": "Weitergabe eines Anteils am geografisch-topografischen Ausgleich an Gemeinden",
                          "fr": "Transmission d'une part de la compensation des charges excessives dues à des facteurs géo-topographiques aux communes",
                          "it": "Trasferimento ai Comuni di una percentuale della perequazione geotopografica",
                          "en": "Forwarding of a share in geographical/topographic equalization to municipalities"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "36224",
                        "labels": {
                          "de": "Weitergabe eines Anteils am Härteausgleich an Gemeinden",
                          "fr": "Transmission d'une part de la compensation des cas de rigueur aux communes",
                          "it": "Trasferimento ai Comuni di una percentuale della compensazione dei casi di rigore",
                          "en": "Forwarding of a share in cohesion fund to municipalities"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "36225",
                        "labels": {
                          "de": "Innerkantonaler vertikaler Finanzausgleich",
                          "fr": "Péréquation financière intracantonale verticale",
                          "it": "Perequazione finanziaria intracantonale verticale",
                          "en": "Intra-cantonal vertical fiscal equalization"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "36226",
                        "labels": {
                          "de": "Innerkantonaler vertikaler Lastenausgleich",
                          "fr": "Compensation des charges intracantonale verticale",
                          "it": "Compensazione degli oneri intracantonale verticale",
                          "en": "Intra-cantonal vertical cost compensation"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "36227",
                        "labels": {
                          "de": "Horizontaler Finanzausgleich von Gemeinde an Gemeinde",
                          "fr": "Péréquation financière horizontale : transferts entre communes",
                          "it": "Perequazione finanziaria horizontale da Comune a Comune",
                          "en": "Horizontal fiscal equalization between municipalities"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "36228",
                        "labels": {
                          "de": "Horizontaler Lastenausgleich von Gemeinde an Gemeinde",
                          "fr": "Compensation horizontale des charges : transferts entre communes",
                          "it": "Compensazione horizontale degli oneri da Comune a Comune",
                          "en": "Horizontal cost compensation between municipalities"
                        },
                        "values": new Map(),
                        "children": []
                      }
                    ]
                  },
                  {
                    "code": "3624",
                    "labels": {
                      "de": "Finanz- und Lastenausgleich an öffentliche Unternehmen",
                      "fr": "Péréquation financière et compensation des charges aux entreprises publiques",
                      "it": "Perequazione finanziaria e compensazione degli oneri a imprese pubbliche",
                      "en": "Fiscal equalization and cost compensation for public corporations"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "3629",
                    "labels": {
                      "de": "Finanzausgleich n.a.g.",
                      "fr": "Péréquation financière n.c.a.",
                      "it": "Perequazione finanziaria n.m.a.",
                      "en": "Fiscal equalization n.e.c."
                    },
                    "values": new Map(),
                    "children": []
                  }
                ]
              },
              {
                "code": "363",
                "labels": {
                  "de": "Beiträge an Gemeinwesen und Dritte",
                  "fr": "Contributions aux collectivités publiques et tiers",
                  "it": "Contributi a enti pubblici e a terzi",
                  "en": "Contributions to public authorities and third parties"
                },
                "values": new Map(),
                "children": [
                  {
                    "code": "3630",
                    "labels": {
                      "de": "Beiträge an den Bund",
                      "fr": "Contributions à la Confédération",
                      "it": "Contributi alla Confederazione",
                      "en": "Contributions to the Confederation"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "3631",
                    "labels": {
                      "de": "Beiträge an Kantone und Konkordate",
                      "fr": "Contributions aux cantons et concordats",
                      "it": "Contributi a Cantoni e Concordati",
                      "en": "Contributions to cantons and concordats"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "3632",
                    "labels": {
                      "de": "Beiträge an Gemeinden und Gemeindezweckverbände",
                      "fr": "Contributions aux communes et syndicats intercommunaux",
                      "it": "Contributi a Comuni e consorzi comunali",
                      "en": "Contributions to municipalities and special purpose entities"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "3633",
                    "labels": {
                      "de": "Beiträge an öffentliche Sozialversicherungen",
                      "fr": "Contributions aux assurances sociales publiques",
                      "it": "Contributi ad assicurazioni sociali pubbliche",
                      "en": "Contributions to social security funds"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "3634",
                    "labels": {
                      "de": "Beiträge an öffentliche Unternehmen",
                      "fr": "Contributions aux entreprises publiques",
                      "it": "Contributi a imprese pubbliche",
                      "en": "Contributions to public corporations"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "3635",
                    "labels": {
                      "de": "Beiträge an private Unternehmen",
                      "fr": "Contributions aux entreprises privées",
                      "it": "Contributi a imprese private",
                      "en": "Contributions to private corporations"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "3636",
                    "labels": {
                      "de": "Beiträge an private Organisationen ohne Erwerbszweck",
                      "fr": "Contributions aux organisations privées à but non lucratif",
                      "it": "Contributi a organizzazioni private senza scopo di lucro",
                      "en": "Contributions to private non-profit organizations"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "3637",
                    "labels": {
                      "de": "Beiträge an private Haushalte",
                      "fr": "Contributions aux ménages privés",
                      "it": "Contributi a economie domestiche private",
                      "en": "Contributions to households"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "3638",
                    "labels": {
                      "de": "Beiträge an das Ausland",
                      "fr": "Contributions à l'étranger",
                      "it": "Contributi all’estero",
                      "en": "Contributions abroad"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "3639",
                    "labels": {
                      "de": "Stipendien",
                      "fr": "Bourses",
                      "it": "Borse di studio",
                      "en": "Scholarships"
                    },
                    "values": new Map(),
                    "children": []
                  }
                ]
              },
              {
                "code": "364",
                "labels": {
                  "de": "Wertberichtigungen Darlehen, VV",
                  "fr": "Réévaluation de prêts, PA",
                  "it": "Rettificazioni di valore su mutui, beni amministrativi",
                  "en": "Value adjustments on loans, AA"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "365",
                "labels": {
                  "de": "Wertberichtigungen Beteiligungen, VV",
                  "fr": "Réévaluation de participations, PA",
                  "it": "Rettificazioni di valore su partecipazioni, beni amministrativi",
                  "en": "Value adjustments on financial interests, AA"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "366",
                "labels": {
                  "de": "Abschreibungen auf Investitionsbeiträge",
                  "fr": "Amortissement de contributions à des investissements",
                  "it": "Ammortamenti su contributi agli investimenti",
                  "en": "Depreciation of investment contributions"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "369",
                "labels": {
                  "de": "Übriger Transferaufwand",
                  "fr": "Autres charges de transfert",
                  "it": "Rimanenti spese inconto capitale",
                  "en": "Other transfer expenses"
                },
                "values": new Map(),
                "children": []
              }
            ]
          },
          {
            "code": "38",
            "labels": {
              "de": "Ausserordentlicher Aufwand",
              "fr": "Charges extraordinaires",
              "it": "Spese straordinarie",
              "en": "Extraordinary expenses"
            },
            "values": new Map(),
            "children": [
              {
                "code": "380",
                "labels": {
                  "de": "Ausserordentlicher Personalaufwand",
                  "fr": "Charges de personnel extraordinaires",
                  "it": "Spese straordinarie per il personale",
                  "en": "Extraordinary personnel expenses"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "381",
                "labels": {
                  "de": "Ausserordentlicher Sach- und Betriebsaufwand",
                  "fr": "Charges de biens et services et charges d'exploitation extraordinaires",
                  "it": "Spese straordinarie per beni e servizi e d’esercizio",
                  "en": "Extraordinary general, administrative and operating expenses"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "383",
                "labels": {
                  "de": "Zusätzliche Abschreibungen",
                  "fr": "Amortissements supplémentaires",
                  "it": "Ammortamenti supplementari",
                  "en": "Additional depreciation"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "384",
                "labels": {
                  "de": "Ausserordentlicher Finanzaufwand",
                  "fr": "Charges financières extraordinaires",
                  "it": "Spese finanziarie straordinarie",
                  "en": "Extraordinary financial expense"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "386",
                "labels": {
                  "de": "Ausserordentlicher Transferaufwand",
                  "fr": "Charges de transfert extraordinaires",
                  "it": "Spese di riversamento straordinarie",
                  "en": "Extraordinary transfer expenses"
                },
                "values": new Map(),
                "children": [
                  {
                    "code": "3860",
                    "labels": {
                      "de": "Ausserordentlicher Transferaufwand; Bund",
                      "fr": "Charges de transfert extraordinaires; Confédération",
                      "it": "Spese di riversamento straordinarie; Confederazione",
                      "en": "Extraordinary transfer expenses; Confederation"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "3861",
                    "labels": {
                      "de": "Ausserordentlicher Transferaufwand; Kantone und Konkordate",
                      "fr": "Charges de transfert extraordinaires; cantons et concordats",
                      "it": "Spese di riversamento straordinarie; Cantoni e Concordati",
                      "en": "Extraordinary transfer expenses; cantons and concordats"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "3862",
                    "labels": {
                      "de": "Ausserordentlicher Transferaufwand; Gemeinden und Gemeindezweckverbände",
                      "fr": "Charges de transfert extraordinaires; communes et syndicats intercommunaux",
                      "it": "Spese di riversamento straordinarie; Comuni e consorzi comunali",
                      "en": "Extraordinary transfer expenses; municipalities and special purpose entities"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "3863",
                    "labels": {
                      "de": "Ausserordentlicher Transferaufwand; öffentliche Sozialversicherungen",
                      "fr": "Charges de transfert extraordinaires; assurances sociales publiques",
                      "it": "Spese di riversamento straordinarie; assicurazioni sociali pubbliche",
                      "en": "Extraordinary transfer expenses; social security funds"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "3864",
                    "labels": {
                      "de": "Ausserordentlicher Transferaufwand; öffentliche Unternehmen",
                      "fr": "Charges de transfert extraordinaires; entreprises publiques",
                      "it": "Spese di riversamento straordinarie; imprese pubbliche",
                      "en": "Extraordinary transfer expenses; public corporations"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "3865",
                    "labels": {
                      "de": "Ausserordentlicher Transferaufwand; private Unternehmen",
                      "fr": "Charges de transfert extraordinaires; entreprises privées",
                      "it": "Spese di riversamento straordinarie; imprese private",
                      "en": "Extraordinary transfer expenses; private corporations"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "3866",
                    "labels": {
                      "de": "Ausserordentlicher Transferaufwand; private Organisationen ohne Erwerbszweck",
                      "fr": "Charges de transfert extraordinaires; organisations privées à but non lucratif",
                      "it": "Spese di riversamentoe straordinarie; organizzazioni private senza scopo di lucro",
                      "en": "Extraordinary transfer expenses; private non-profit organizations"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "3867",
                    "labels": {
                      "de": "Ausserordentlicher Transferaufwand; private Haushalte",
                      "fr": "Charges de transfert extraordinaires; ménages privés",
                      "it": "Spese di riversamento straordinarie; economie domestiche private",
                      "en": "Extraordinary transfer expenses; households"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "3868",
                    "labels": {
                      "de": "Ausserordentlicher Transferaufwand; Ausland",
                      "fr": "Charges de transfert extraordinaires; étranger",
                      "it": "Spese di riversamento straordinarie; estero",
                      "en": "Extraordinary transfer expenses; abroad"
                    },
                    "values": new Map(),
                    "children": []
                  }
                ]
              },
              {
                "code": "387",
                "labels": {
                  "de": "Zusätzliche Abschreibungen auf Darlehen, Beteiligungen und Investitionsbeiträgen",
                  "fr": "Amortissement supplémentaire des prêts, participations et contribution à des investissements",
                  "it": "Ammortamenti supplementari su mutui, partecipazioni e contributi agli investimenti",
                  "en": "Additional depreciation on loans, financial interests, and investment contributions"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "389",
                "labels": {
                  "de": "Einlagen in das Eigenkapital",
                  "fr": "Attributions au capital propre",
                  "it": "Versamenti al capitale proprio",
                  "en": "Net expenditure for net assets/equity"
                },
                "values": new Map(),
                "children": []
              }
            ]
          }
        ]
      },
      {
        "code": "4",
        "labels": {
          "de": "Ertrag",
          "fr": "Revenus",
          "it": "Ricavi",
          "en": "Revenue"
        },
        "values": new Map(),
        "children": [
          {
            "code": "40",
            "labels": {
              "de": "Fiskalertrag",
              "fr": "Revenus fiscaux",
              "it": "Introiti fiscali",
              "en": "Tax revenue"
            },
            "values": new Map(),
            "children": [
              {
                "code": "400",
                "labels": {
                  "de": "Direkte Steuern natürliche Personen",
                  "fr": "Impôts directs, personnes physiques",
                  "it": "Imposte dirette di persone fisiche",
                  "en": "Direct taxes, natural persons"
                },
                "values": new Map(),
                "children": [
                  {
                    "code": "4000",
                    "labels": {
                      "de": "Einkommenssteuern natürliche Personen",
                      "fr": "Impôts sur le revenu, personnes physiques",
                      "it": "Imposte sul reddito di persone fisiche",
                      "en": "Income tax, natural persons"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4001",
                    "labels": {
                      "de": "Vermögenssteuern natürliche Personen",
                      "fr": "Impôts sur la fortune, personnes physiques",
                      "it": "Imposte sulla sostanza di persone fisiche",
                      "en": "Wealth tax, natural persons"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4002",
                    "labels": {
                      "de": "Quellensteuern natürliche Personen",
                      "fr": "Impôts à la source, personnes physiques",
                      "it": "Imposte alla fonte di persone fisiche",
                      "en": "Withholding taxes, natural persons"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4008",
                    "labels": {
                      "de": "Personensteuern",
                      "fr": "Impôts sur les personnes",
                      "it": "Imposte personali",
                      "en": "Personal taxes"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4009",
                    "labels": {
                      "de": "Übrige direkte Steuern natürliche Personen",
                      "fr": "Autres impôts directs, personnes physiques",
                      "it": "Rimanenti imposte dirette di persone fisiche",
                      "en": "Other direct taxes, natural persons"
                    },
                    "values": new Map(),
                    "children": []
                  }
                ]
              },
              {
                "code": "401",
                "labels": {
                  "de": "Direkte Steuern juristische Personen",
                  "fr": "Impôts directs, personnes morales",
                  "it": "Imposte dirette di persone giuridiche",
                  "en": "Direct taxes, legal entities"
                },
                "values": new Map(),
                "children": [
                  {
                    "code": "4010",
                    "labels": {
                      "de": "Gewinnsteuern juristische Personen",
                      "fr": "Impôts sur le bénéfice, personnes morales",
                      "it": "Imposte sull'utile di persone giuridiche",
                      "en": "Profit taxes, legal entities"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4011",
                    "labels": {
                      "de": "Kapitalsteuern juristische Personen",
                      "fr": "Impôts sur le capital, personnes morales",
                      "it": "Imposte sul capitale di persone giuridiche",
                      "en": "Taxes on capital, legal entities"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4012",
                    "labels": {
                      "de": "Quellensteuern juristische Personen",
                      "fr": "Impôts à la source, personnes morales",
                      "it": "Imposte alla fonte di persone giuridiche",
                      "en": "Withholding taxes, legal entities"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4019",
                    "labels": {
                      "de": "Übrige direkte Steuern juristische Personen",
                      "fr": "Autres impôts directs, personnes morales",
                      "it": "Rimanenti imposte dirette di persone giuridiche",
                      "en": "Other direct taxes, legal entities"
                    },
                    "values": new Map(),
                    "children": []
                  }
                ]
              },
              {
                "code": "402",
                "labels": {
                  "de": "Übrige direkte Steuern",
                  "fr": "Autres impôts directs",
                  "it": "Rimanenti imposte dirette",
                  "en": "Other direct taxes"
                },
                "values": new Map(),
                "children": [
                  {
                    "code": "4020",
                    "labels": {
                      "de": "Verrechnungssteuer (nur Bund)",
                      "fr": "Impôt anticipé (uniquement Confédération)",
                      "it": "Imposta preventiva (solo Confederazione)",
                      "en": "Withholding tax (Confederation only)"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4021",
                    "labels": {
                      "de": "Grundsteuern",
                      "fr": "Impôts fonciers",
                      "it": "Imposte fondiarie",
                      "en": "Property tax"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4022",
                    "labels": {
                      "de": "Vermögensgewinnsteuern",
                      "fr": "Impôts sur les gains en capital",
                      "it": "Imposte sugli utili patrimoniali",
                      "en": "Capital gains tax"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4023",
                    "labels": {
                      "de": "Vermögensverkehrssteuern",
                      "fr": "Droits de mutation et timbre",
                      "it": "Imposte sulle transazioni patrimoniali",
                      "en": "Capital transfer tax"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4024",
                    "labels": {
                      "de": "Erbschafts- und Schenkungssteuern",
                      "fr": "Impôts sur les successions et donations",
                      "it": "Imposte sulle successioni e sulle donazioni",
                      "en": "Inheritance and gift tax"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4025",
                    "labels": {
                      "de": "Spielbanken- und Spielautomatenabgabe",
                      "fr": "Impôts sur les maisons de jeu et machines à sous",
                      "it": "Tassa sulle case da gioco e sugli apparecchi automatici da gioco",
                      "en": "Casino and slot machine tax"
                    },
                    "values": new Map(),
                    "children": []
                  }
                ]
              },
              {
                "code": "403",
                "labels": {
                  "de": "Besitz- und Aufwandsteuern",
                  "fr": "Impôts sur la possession et la dépense",
                  "it": "Imposte sul possesso e sulla spesa",
                  "en": "Property and expenditure taxes"
                },
                "values": new Map(),
                "children": [
                  {
                    "code": "4030",
                    "labels": {
                      "de": "Motorfahrzeugsteuern",
                      "fr": "Impôts sur les véhicules à moteur",
                      "it": "Tasse sul traffico",
                      "en": "Motor vehicle taxes"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4031",
                    "labels": {
                      "de": "Schiffssteuer",
                      "fr": "Impôt sur les bateaux",
                      "it": "Imposta sui natanti",
                      "en": "Boat tax"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4032",
                    "labels": {
                      "de": "Vergnügungssteuern",
                      "fr": "Impôts sur les divertissements",
                      "it": "Imposte sugli spettacoli",
                      "en": "Entertainment tax"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4033",
                    "labels": {
                      "de": "Hundesteuer",
                      "fr": "Impôt sur les chiens",
                      "it": "Imposta sui cani",
                      "en": "Dog license"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4039",
                    "labels": {
                      "de": "Übrige Besitz- und Aufwandsteuer",
                      "fr": "Autres impôts sur la possession et la dépense",
                      "it": "Rimanenti imposte sul possesso e sulla spesa",
                      "en": "Other property and expenditure taxes"
                    },
                    "values": new Map(),
                    "children": []
                  }
                ]
              },
              {
                "code": "404",
                "labels": {
                  "de": "Verbrauchssteuern (nur Bund)",
                  "fr": "Impôts à la consommation (uniquement Confédération)",
                  "it": "Imposte sul consumo (solo Confederazione)",
                  "en": "Consumption taxes (Confederation only)"
                },
                "values": new Map(),
                "children": [
                  {
                    "code": "4040",
                    "labels": {
                      "de": "Mehrwertsteuer",
                      "fr": "Taxe sur la valeur ajoutée",
                      "it": "Imposta sul valore aggiunto",
                      "en": "Value added tax"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4041",
                    "labels": {
                      "de": "Stempelabgabe",
                      "fr": "Droit de timbre",
                      "it": "Tassa di bollo",
                      "en": "Stamp duty"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4042",
                    "labels": {
                      "de": "Mineralölsteuer auf Treibstoffen",
                      "fr": "Impôt sur les huiles minérales grevant les carburants",
                      "it": "Imposta sugli oli minerali gravante i carburanti",
                      "en": "Mineral oil tax on fuel"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4043",
                    "labels": {
                      "de": "Mineralölsteuerzuschlag auf Treibstoffen",
                      "fr": "Surtaxe sur les huiles minérales grevant les carburants",
                      "it": "Supplemento fiscale sugli oli minerali gravante i carburanti",
                      "en": "Mineral oil surtax on motor fuel"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4044",
                    "labels": {
                      "de": "Mineralölsteuer auf Brennstoffen und and. Mineralölprodukten",
                      "fr": "Impôt sur les huiles minérales grevant les combustibles et les autres produits pétroliers",
                      "it": "Imposta sugli oli minerali riscossa sui combustibili e altri prodotti derivati dagli oli minerali",
                      "en": "Mineral oil tax on combustibles and other mineral oil products"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4045",
                    "labels": {
                      "de": "Tabaksteuer",
                      "fr": "Impôt sur le tabac",
                      "it": "Imposta sul tabacco",
                      "en": "Tobacco duty"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4046",
                    "labels": {
                      "de": "Biersteuer",
                      "fr": "Impôt sur la bière",
                      "it": "Imposta sulla birra",
                      "en": "Beer tax"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4047",
                    "labels": {
                      "de": "Besteuerung gebrannter Wasser (EAV)",
                      "fr": "Imposition des boissons distillées (RFA)",
                      "it": "Imposizione dei bevande distillate (RFA)",
                      "en": "Taxation of distilled spirits (SAB)"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4049",
                    "labels": {
                      "de": "Verbrauchssteuern n.a.g.",
                      "fr": "Impôts à la consommation n.c.a.",
                      "it": "Imposte sul consumo n.m.a.",
                      "en": "Consumption taxes n.e.c."
                    },
                    "values": new Map(),
                    "children": []
                  }
                ]
              },
              {
                "code": "405",
                "labels": {
                  "de": "Verkehrsabgaben",
                  "fr": "Redevances sur la circulation",
                  "it": "Tasse sul traffico",
                  "en": "Transportation taxes"
                },
                "values": new Map(),
                "children": [
                  {
                    "code": "4050",
                    "labels": {
                      "de": "Automobilsteuer",
                      "fr": "Impôt sur les véhicules automobiles",
                      "it": "Imposta sugli autoveicoli",
                      "en": "Automobile duty"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4051",
                    "labels": {
                      "de": "Nationalstrassenabgabe",
                      "fr": "Redevance pour l'utilisation des routes nationales",
                      "it": "Tassa per l'utilizzazione delle strade nazionali",
                      "en": "Motorway tax"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4052",
                    "labels": {
                      "de": "Schwerverkehrsabgabe",
                      "fr": "Redevance sur le trafic des poids lourds",
                      "it": "Tassa sul traffico pesante",
                      "en": "Heavy vehicle charge"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4053",
                    "labels": {
                      "de": "Abgaben kombinierter Verkehr",
                      "fr": "Redevances sur le trafic combiné",
                      "it": "Tasse sul traffico combinato",
                      "en": "Combined traffic taxes"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4059",
                    "labels": {
                      "de": "Verkehrsabgaben n.a.g.",
                      "fr": "Redevances sur la circulation n.c.a.",
                      "it": "Tasse sul traffico n.m.a.",
                      "en": "Transportation taxes n.e.c."
                    },
                    "values": new Map(),
                    "children": []
                  }
                ]
              },
              {
                "code": "406",
                "labels": {
                  "de": "Zölle (nur Bund)",
                  "fr": "Droits de douane (uniquement Confédération)",
                  "it": "Dazi (solo Confederazione)",
                  "en": "Customs duties (Confederation only)"
                },
                "values": new Map(),
                "children": [
                  {
                    "code": "4060",
                    "labels": {
                      "de": "Einfuhrzölle",
                      "fr": "Droits de douane à l'importation",
                      "it": "Dazi d'importazione",
                      "en": "Import duties"
                    },
                    "values": new Map(),
                    "children": []
                  }
                ]
              },
              {
                "code": "407",
                "labels": {
                  "de": "Übrige Abgaben",
                  "fr": "Autres taxes",
                  "it": "Rimanenti tasse",
                  "en": "Other duties"
                },
                "values": new Map(),
                "children": [
                  {
                    "code": "4070",
                    "labels": {
                      "de": "Lenkungsabgaben Umweltschutz",
                      "fr": "Taxes d'incitation, protection de l'environnement",
                      "it": "Tasse d'incentivazione per la protezione dell'ambiente",
                      "en": "Environmental incentive fees"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4071",
                    "labels": {
                      "de": "Landwirtschaftliche Abgaben",
                      "fr": "Taxes agricoles",
                      "it": "Tasse agricole",
                      "en": "Agricultural duties"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4072",
                    "labels": {
                      "de": "Sozialversicherungsbeiträge der Versicherten und Arbeitgeber",
                      "fr": "Cotisations des assurés et des employeurs aux assurances sociales",
                      "it": "Contributi degli assicurati e del datore di lavoro alle assicurazioni sociali",
                      "en": "Social security contributions by employers and insured persons"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4079",
                    "labels": {
                      "de": "Sonstiger Fiskalertrag",
                      "fr": "Revenus fiscaux distincts",
                      "it": "Altri introiti fiscali",
                      "en": "Other tax revenue"
                    },
                    "values": new Map(),
                    "children": []
                  }
                ]
              }
            ]
          },
          {
            "code": "41",
            "labels": {
              "de": "Regalien und Konzessionen",
              "fr": "Patentes et concessions",
              "it": "Regalie e concessioni",
              "en": "Royalties and concessions"
            },
            "values": new Map(),
            "children": [
              {
                "code": "410",
                "labels": {
                  "de": "Regalien",
                  "fr": "Patentes",
                  "it": "Regalie",
                  "en": "Royalties"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "411",
                "labels": {
                  "de": "Schweiz. Nationalbank",
                  "fr": "Banque nationale suisse",
                  "it": "Banca nazionale svizzera",
                  "en": "Swiss National Bank"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "412",
                "labels": {
                  "de": "Konzessionen",
                  "fr": "Concessions",
                  "it": "Concessioni",
                  "en": "Concessions"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "413",
                "labels": {
                  "de": "Ertragsanteile an Lotterien, Sport-Toto, Wetten",
                  "fr": "Parts de revenus de loteries, Sport-Toto, paris",
                  "it": "Quote del prodotto di lotterie, Sport-Toto, scommesse",
                  "en": "Revenue shares in lotteries, Sport-Toto, gambling"
                },
                "values": new Map(),
                "children": []
              }
            ]
          },
          {
            "code": "42",
            "labels": {
              "de": "Entgelte",
              "fr": "Compensations",
              "it": "Ricavi e tasse",
              "en": "Revenue from exchange transactions"
            },
            "values": new Map(),
            "children": [
              {
                "code": "420",
                "labels": {
                  "de": "Ersatzabgaben",
                  "fr": "Taxes de compensation",
                  "it": "Tasse di compensazione",
                  "en": "Exemption taxes"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "421",
                "labels": {
                  "de": "Gebühren für Amtshandlungen",
                  "fr": "Emoluments pour actes administratifs",
                  "it": "Emolumenti per atti ufficiali",
                  "en": "Fees for administrative acts"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "422",
                "labels": {
                  "de": "Spital- und Heimtaxen, Kostgelder",
                  "fr": "Taxes pour hôpitaux et établissements médicaux sociaux, subventions aux frais de pension",
                  "it": "Tasse di ospedali e ospizi, rette",
                  "en": "Hospital and care home taxes, meal subsidies"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "423",
                "labels": {
                  "de": "Schul- und Kursgelder",
                  "fr": "Frais d'écolage et taxes de cours",
                  "it": "Tasse scolastiche e per corsi",
                  "en": "School and course fees"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "424",
                "labels": {
                  "de": "Benützungsgebühren und Dienstleistungen",
                  "fr": "Emoluments d'utilisation et prestations de service",
                  "it": "Tasse di utilizzazione e prestazioni di servizi",
                  "en": "User charges and services"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "425",
                "labels": {
                  "de": "Erlös aus Verkäufen",
                  "fr": "Recettes provenant de ventes",
                  "it": "Ricavi da vendite",
                  "en": "Proceeds from sales"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "426",
                "labels": {
                  "de": "Rückerstattungen",
                  "fr": "Remboursements",
                  "it": "Rimborsi",
                  "en": "Reimbursements"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "427",
                "labels": {
                  "de": "Bussen",
                  "fr": "Amendes",
                  "it": "Multe",
                  "en": "Fines"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "429",
                "labels": {
                  "de": "Übrige Entgelte",
                  "fr": "Autres compensations",
                  "it": "Diversi ricavi e tasse",
                  "en": "Other revenue from exchange transactions"
                },
                "values": new Map(),
                "children": []
              }
            ]
          },
          {
            "code": "43",
            "labels": {
              "de": "Übrige Erträge",
              "fr": "Autres revenus",
              "it": "Rimanenti ricavi",
              "en": "Other revenue"
            },
            "values": new Map(),
            "children": [
              {
                "code": "430",
                "labels": {
                  "de": "Übrige betriebliche Erträge",
                  "fr": "Autres revenus d'exploitation",
                  "it": "Rimanenti ricavi d'esercizio",
                  "en": "Other operating revenue"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "431",
                "labels": {
                  "de": "Aktivierung Eigenleistungen",
                  "fr": "Inscription de prestations propres à l'actif",
                  "it": "Iscrizione all'attivo di prestazioni proprie",
                  "en": "Own work capitalized"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "432",
                "labels": {
                  "de": "Bestandesveränderungen",
                  "fr": "Variations de stocks",
                  "it": "Variazioni del saldo",
                  "en": "Changes in inventories"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "439",
                "labels": {
                  "de": "Übriger Ertrag",
                  "fr": "Autres revenus",
                  "it": "Rimanenti ricavi",
                  "en": "Other revenue"
                },
                "values": new Map(),
                "children": []
              }
            ]
          },
          {
            "code": "44",
            "labels": {
              "de": "Finanzertrag",
              "fr": "Revenus financiers",
              "it": "Ricavi finanziari",
              "en": "Financial revenue"
            },
            "values": new Map(),
            "children": [
              {
                "code": "440",
                "labels": {
                  "de": "Zinsertrag",
                  "fr": "Revenus des intérêts",
                  "it": "Ricavi a titolo di interessi",
                  "en": "Interest income"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "441",
                "labels": {
                  "de": "Realisierte Gewinne, FV",
                  "fr": "Gains réalisés, PF",
                  "it": "Utili realizzati, beni patrimoniali",
                  "en": "Realized gains, NAA"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "442",
                "labels": {
                  "de": "Beteiligungsertrag, FV",
                  "fr": "Revenus de participations, PF",
                  "it": "Proventi da partecipazioni, beni patrimoniali",
                  "en": "Revenue from financial interests, NAA"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "443",
                "labels": {
                  "de": "Liegenschaftenertrag, FV",
                  "fr": "Revenus des immeubles, PF",
                  "it": "Redditi immobiliari, beni patrimoniali",
                  "en": "Building revenue, NAA"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "444",
                "labels": {
                  "de": "Wertberichtigungen Anlagen, FV",
                  "fr": "Réévaluation des immobilisations, PF",
                  "it": "Rettificazioni di valore su investimenti, beni patrimoniali",
                  "en": "Value adjustments on investments, NAA"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "445",
                "labels": {
                  "de": "Finanzertrag aus Darlehen und Beteiligungen, VV",
                  "fr": "Revenus financiers de prêts et de participations du PA",
                  "it": "Ricavi finanziari da mutui e partecipazioni, beni amministrativi",
                  "en": "Financial revenue from loans and financial interests, AA"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "446",
                "labels": {
                  "de": "Finanzertrag von öffentlichen Unternehmen",
                  "fr": "Revenus financiers d'entreprises publiques",
                  "it": "Ricavi finanziari di imprese pubbliche",
                  "en": "Financial revenue of public corporations"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "447",
                "labels": {
                  "de": "Liegenschaftenertrag, VV",
                  "fr": "Revenus des immeubles, PA",
                  "it": "Redditi immobiliari, beni amministrativi",
                  "en": "Building revenue, AA"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "448",
                "labels": {
                  "de": "Erträge von gemieteten Liegenschaften, VV",
                  "fr": "Revenus des immeubles loués, PA",
                  "it": "Ricavi da immobili in locazione, beni amministrativi",
                  "en": "Revenue from rented buildings, AA"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "449",
                "labels": {
                  "de": "Übriger Finanzertrag",
                  "fr": "Autres revenus financiers",
                  "it": "Rimanenti ricavi finanziari",
                  "en": "Other financial revenue"
                },
                "values": new Map(),
                "children": []
              }
            ]
          },
          {
            "code": "45",
            "labels": {
              "de": "Entnahmen aus Fonds und Spezialfinanzierungen",
              "fr": "Prélèvements sur les fonds et les financements spéciaux",
              "it": "Prelievi da fondi e finanziamenti speciali",
              "en": "Withdrawals from funds and special financing"
            },
            "values": new Map(),
            "children": [
              {
                "code": "450",
                "labels": {
                  "de": "Entnahmen aus Fonds und Spezialfinanzierungen im Fremdkapital",
                  "fr": "Prélèvements sur les fonds et les financements spéciaux enregistrés sous capitaux de tiers",
                  "it": "Prelievi da fondi e finanziamenti speciali nel capitale di terzi",
                  "en": "Withdrawals from funds and special financing in liabilities"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "451",
                "labels": {
                  "de": "Entnahmen aus Fonds und Spezialfinanzierungen im Eigenkapital",
                  "fr": "Prélèvements sur les fonds et les financements spéciaux enregistrés sous capital propre",
                  "it": "Prelievi da fondi e finanziamenti speciali nel capitale proprio",
                  "en": "Withdrawals from funds and special financing in net assets/equity"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "452",
                "labels": {
                  "de": "Entnahmen aus Fonds und Spezialfinanzierungen n.a.g.",
                  "fr": "Prélèvements sur les fonds et les financements spéciaux n.c.a.",
                  "it": "Prelievi da fondi e finanziamenti speciali n.m.a.",
                  "en": "Withdrawals from funds and special financing n.e.c."
                },
                "values": new Map(),
                "children": []
              }
            ]
          },
          {
            "code": "46",
            "labels": {
              "de": "Transferertrag",
              "fr": "Revenus de transfert",
              "it": "Ricavi da riversamenti",
              "en": "Transfer revenue"
            },
            "values": new Map(),
            "children": [
              {
                "code": "460",
                "labels": {
                  "de": "Ertragsanteile",
                  "fr": "Parts de revenus",
                  "it": "Partecipazioni a ricavi",
                  "en": "Revenue shares"
                },
                "values": new Map(),
                "children": [
                  {
                    "code": "4600",
                    "labels": {
                      "de": "Anteil am Ertrag Bundeserträgen",
                      "fr": "Part des revenus de la Confédération",
                      "it": "Partecipazione ai ricavi della Confederazione",
                      "en": "Share in revenue, Confederation revenue"
                    },
                    "values": new Map(),
                    "children": [
                      {
                        "code": "46000",
                        "labels": {
                          "de": "Anteil am Ertrag Direkter Bundessteuer",
                          "fr": "Part des revenus de l'impôt fédéral direct",
                          "it": "Partecipazione ai ricavi dell'imposta federale diretta",
                          "en": "Share in revenue of direct federal tax"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "46001",
                        "labels": {
                          "de": "Anteil am Ertrag Verrechnungssteuer",
                          "fr": "Part des revenus de l'impôt anticipé",
                          "it": "Partecipazione ai ricavi dell’imposta preventiva",
                          "en": "Share in revenue of withholding tax"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "46002",
                        "labels": {
                          "de": "Anteil am Ertrag Wehrpflichtersatz",
                          "fr": "Part des revenus de la taxe d'exemption de l'obligation de servir",
                          "it": "Partecipazione ai ricavi della tassa d’esenzione dall’obbligo militare",
                          "en": "Share in revenue of military service exemption tax"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "46003",
                        "labels": {
                          "de": "Anteil am Ertrag Eidg. Alkoholverwaltung",
                          "fr": "Part des revenus de la Régie fédérale des alcools",
                          "it": "Partecipazione ai ricavi della Regìa federale degli alcool",
                          "en": "Share in revenue of the Swiss Alcohol Board"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "46004",
                        "labels": {
                          "de": "Anteil am Ertrag Eidg. Bussen und Taxen",
                          "fr": "Part des revenus des amendes et taxes fédérales",
                          "it": "Partecipazione ai ricavi di tasse e multe della Confederazione",
                          "en": "Share in revenue from federal fines and duties"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "46005",
                        "labels": {
                          "de": "Anteil am Ertrag Eidg. Mineralölsteuer",
                          "fr": "Part des revenus de l'impôt fédéral sur les huiles minérales",
                          "it": "Partecipazione ai ricavi dell’imposta federale sugli oli minerali",
                          "en": "Share in federal mineral oil tax revenue"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "46006",
                        "labels": {
                          "de": "Anteil am Ertrag Eidg. Stempelsteuer",
                          "fr": "Part des revenus des droits de timbre fédéraux",
                          "it": "Partecipazione ai ricavi della tassa di bollo",
                          "en": "Share in federal stamp duty revenue"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "46007",
                        "labels": {
                          "de": "Anteil am Ertrag EU-Zinsbesteuerung",
                          "fr": "Part des revenus de la fiscalité de l'épargne UE",
                          "it": "Partecipazione ai ricavi della fiscalità del risparmio dell’UE",
                          "en": "Share in EU savings tax revenue"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "46008",
                        "labels": {
                          "de": "Anteil am Ertrag LSVA",
                          "fr": "Part des revenus de la RPLP",
                          "it": "Partecipazione ai ricavi della TTPCP",
                          "en": "Share in mileage-related heavy vehicle charge revenue"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "46009",
                        "labels": {
                          "de": "Anteil am Ertrag übriger Bundeseinnahmen",
                          "fr": "Part des autres revenus de la Confédération",
                          "it": "Partecipazione ai ricavi delle rimanenti entrate della Confederazione",
                          "en": "Share in revenue from other federal receipts"
                        },
                        "values": new Map(),
                        "children": []
                      }
                    ]
                  },
                  {
                    "code": "4601",
                    "labels": {
                      "de": "Anteil an Kantonserträgen und Konkordaten",
                      "fr": "Part des revenus des cantons et concordats",
                      "it": "Partecipazioni ai ricavi di Cantoni e concordati",
                      "en": "Share in revenue of cantons and concordats"
                    },
                    "values": new Map(),
                    "children": [
                      {
                        "code": "46010",
                        "labels": {
                          "de": "Anteil am Ertrag kantonaler Steuern",
                          "fr": "Part des revenus des impôts cantonaux",
                          "it": "Partecipazione ai ricavi delle imposte cantonali",
                          "en": "Share in cantonal tax revenue"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "46011",
                        "labels": {
                          "de": "Anteil am Ertrag kantonaler Regalien und Konzessionen",
                          "fr": "Part des revenus des patentes et concessions cantonales",
                          "it": "Partecipazione ai ricavi di regalie e concessioni cantonali",
                          "en": "Share in revenue from cantonal royalties and concessions"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "46012",
                        "labels": {
                          "de": "Anteil an kantonalen Gebühren",
                          "fr": "Part des émoluments cantonaux",
                          "it": "Partecipazione a tasse cantonali",
                          "en": "Share in cantonal fees"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "46019",
                        "labels": {
                          "de": "Anteil an übrigen kantonalen Erträgen",
                          "fr": "Part des autres revenus cantonaux",
                          "it": "Partecipazione ai rimanenti ricavi cantonali",
                          "en": "Share in other cantonal revenue"
                        },
                        "values": new Map(),
                        "children": []
                      }
                    ]
                  },
                  {
                    "code": "4603",
                    "labels": {
                      "de": "Anteil an Erträgen öffentlicher Sozialversicherungsanstalten",
                      "fr": "Part des revenus des institutions publiques d'assurance sociale",
                      "it": "Partecipazioni a ricavi di istituti di assicurazioni sociali pubbliche",
                      "en": "Share in revenue of social security funds"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4604",
                    "labels": {
                      "de": "Anteile an Erträgen öffentlicher Unternehmen",
                      "fr": "Parts des revenus des entreprises publiques",
                      "it": "Partecipazioni a ricavi di imprese pubbliche",
                      "en": "Share in revenue of public corporations"
                    },
                    "values": new Map(),
                    "children": []
                  }
                ]
              },
              {
                "code": "461",
                "labels": {
                  "de": "Entschädigungen",
                  "fr": "Indemnités",
                  "it": "Indennizzi",
                  "en": "Compensation"
                },
                "values": new Map(),
                "children": [
                  {
                    "code": "4610",
                    "labels": {
                      "de": "Entschädigungen vom Bund",
                      "fr": "Indemnités de la Confédération",
                      "it": "Indennizzi della Confederazione",
                      "en": "Compensation from the Confederation"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4611",
                    "labels": {
                      "de": "Entschädigungen von Kantonen und Konkordaten",
                      "fr": "Indemnités des cantons et concordats",
                      "it": "Indennizzi di Cantoni e concordati",
                      "en": "Compensation from cantons and concordats"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4612",
                    "labels": {
                      "de": "Entschädigungen von Gemeinden und Gemeindezweckverbänden",
                      "fr": "Indemnités des communes et syndicats intercommunaux",
                      "it": "Indennizzi di Comuni e consorzi comunali",
                      "en": "Compensation from municipalities and special purpose entities"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4613",
                    "labels": {
                      "de": "Entschädigungen von öffentlichen Sozialversicherungen",
                      "fr": "Indemnités des assurances sociales publiques",
                      "it": "Indennizzi di assicurazioni sociali pubbliche",
                      "en": "Compensation from social security funds"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4614",
                    "labels": {
                      "de": "Entschädigungen von öffentlichen Unternehmen",
                      "fr": "Indemnités des entreprises publiques",
                      "it": "Indennizzi di imprese pubbliche",
                      "en": "Compensation from public corporations"
                    },
                    "values": new Map(),
                    "children": []
                  }
                ]
              },
              {
                "code": "462",
                "labels": {
                  "de": "Finanz- und Lastenausgleich",
                  "fr": "Péréquation financière et compensation des charges",
                  "it": "Perequazione finanziaria e compensazione degli oneri",
                  "en": "Fiscal equalization and cost compensation"
                },
                "values": new Map(),
                "children": [
                  {
                    "code": "4620",
                    "labels": {
                      "de": "Finanz- und Lastenausgleich Bund",
                      "fr": "Péréquation financière et compensation des charges de la Confédération",
                      "it": "Perequazione finanziaria e compensazione degli oneri, Confederazione",
                      "en": "Fiscal equalization and cost compensation, Confederation"
                    },
                    "values": new Map(),
                    "children": [
                      {
                        "code": "46201",
                        "labels": {
                          "de": "Ressourcenausgleich",
                          "fr": "Péréquation des ressources",
                          "it": "Perequazione delle risorse",
                          "en": "Resource equalization"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "46202",
                        "labels": {
                          "de": "Sozio-demografischer Ausgleich",
                          "fr": "Compensation des charges excessives dues à des facteurs socio-démographiques",
                          "it": "Perequazione sociodemografica",
                          "en": "Socio-demographic equalization"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "46203",
                        "labels": {
                          "de": "Geografisch-topografischer Ausgleich",
                          "fr": "Compensation des charges excessives dues à des facteurs géo-topographiques",
                          "it": "Perequazione geotopografica",
                          "en": "Geographical/topographic equalization"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "46204",
                        "labels": {
                          "de": "Härteausgleich",
                          "fr": "Compensation des cas de rigueur",
                          "it": "Compensazione dei casi di rigore",
                          "en": "Cohesion fund"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "46209",
                        "labels": {
                          "de": "Übrige Massnahmen des Finanzausgleichs",
                          "fr": "Autres mesures liées à la péréquation financière",
                          "it": "Rimanenti misure della perequazione finanziaria",
                          "en": "Other measures of the fiscal equalization"
                        },
                        "values": new Map(),
                        "children": []
                      }
                    ]
                  },
                  {
                    "code": "4621",
                    "labels": {
                      "de": "Finanz- und Lastenausgleich von Kantonen",
                      "fr": "Péréquation financière et compensation des charges des cantons",
                      "it": "Perequazione finanziaria e compensazione degli oneri di Cantoni",
                      "en": "Fiscal equalization and cost compensation from cantons"
                    },
                    "values": new Map(),
                    "children": [
                      {
                        "code": "46211",
                        "labels": {
                          "de": "Ressourcenausgleich",
                          "fr": "Péréquation des ressources",
                          "it": "Perequazione delle risorse",
                          "en": "Resource equalization"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "46212",
                        "labels": {
                          "de": "Anteil am sozio-demografischen Lastenausgleich des Kantons",
                          "fr": "Part de la compensation des charges excessives dues à des facteurs socio-démographiques du canton",
                          "it": "Quota alla compensazione degli oneri eccessivi dovuti a fattori sociodemografici del Cantone",
                          "en": "Share in the socio-demographic equalization of the canton"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "46213",
                        "labels": {
                          "de": "Anteil am geografisch-topografischen Lastenausgleich des Kantons",
                          "fr": "Part de la compensation des charges excessives dues à des facteurs géo-topographiques du canton",
                          "it": "Quota alla compensazione degli oneri eccessivi dovuti a fattori geotopografici del Cantone",
                          "en": "Share in the geographical & topographic equalization of the canton"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "46214",
                        "labels": {
                          "de": "Härteausgleich",
                          "fr": "Compensation des cas de rigueur",
                          "it": "Compensazione dei casi di rigore",
                          "en": "Cohesion fund"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "46215",
                        "labels": {
                          "de": "Vertikaler Finanzausgleich von Kanton zu Gemeinden",
                          "fr": "Péréquation financière verticale du canton aux communes",
                          "it": "Perequazione finanziaria verticale da Cantone a Comuni",
                          "en": "Vertical fiscal equalization between canton and municipalities"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "46216",
                        "labels": {
                          "de": "Vertikaler Lastenausgleich von Kanton zu Gemeinden",
                          "fr": "Compensation verticale des charges du canton aux communes",
                          "it": "Compensazione verticale degli oneri da Cantone a Comuni",
                          "en": "Vertical cost compensation between canton and municipalities"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "46217",
                        "labels": {
                          "de": "Ressourcen- und Härteausgleich von Geberkantonen",
                          "fr": "Péréquation des ressources et compensation des cas de rigueur des cantons contributeurs",
                          "it": "Perequazione delle risorse e compensazione dei casi di rigore dei Cantoni donatori",
                          "en": "Resource equalization and cohesion fund from donor cantons"
                        },
                        "values": new Map(),
                        "children": []
                      }
                    ]
                  },
                  {
                    "code": "4622",
                    "labels": {
                      "de": "Finanz- und Lastenausgleich von Gemeinden",
                      "fr": "Péréquation financière et compensation des charges des communes",
                      "it": "Perequazione finanziaria e compensazione degli oneri di Comuni",
                      "en": "Fiscal equalization and cost compensation from municipalities"
                    },
                    "values": new Map(),
                    "children": [
                      {
                        "code": "46225",
                        "labels": {
                          "de": "Innerkantonaler vertikaler Finanzausgleich",
                          "fr": "Péréquation financière intracantonale verticale",
                          "it": "Perequazione finanziaria intracantonale verticale",
                          "en": "Intra-cantonal vertical fiscal equalization"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "46226",
                        "labels": {
                          "de": "Innerkantonaler vertikaler Lastenausgleich",
                          "fr": "Compensation des charges intracantonale verticale",
                          "it": "Compensazione degli oneri intracantonale verticale",
                          "en": "Intra-cantonal vertical cost compensation"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "46227",
                        "labels": {
                          "de": "Horizontaler Finanzausgleich von Gemeinde an Gemeinde",
                          "fr": "Péréquation financière horizontale : transferts entre communes",
                          "it": "Perequazione finanziaria horizontale da Comune a Comune",
                          "en": "Horizontal fiscal equalization between municipalities"
                        },
                        "values": new Map(),
                        "children": []
                      },
                      {
                        "code": "46228",
                        "labels": {
                          "de": "Horizontaler Lastenausgleich von Gemeinde an Gemeinde",
                          "fr": "Compensation horizontale des charges : transferts entre communes",
                          "it": "Compensazione horizontale degli oneri da Comune a Comune",
                          "en": "Horizontal cost compensation between municipalities"
                        },
                        "values": new Map(),
                        "children": []
                      }
                    ]
                  },
                  {
                    "code": "4624",
                    "labels": {
                      "de": "Finanz- und Lastenausgleich von öffentlichen Unternehmen",
                      "fr": "Péréquation financière et compensation des charges des entreprises publiques",
                      "it": "Perequazione finanziaria e compensazione degli oneri dalle imprese pubbliche",
                      "en": "Fiscal equalization and cost compensation from public corporations"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4629",
                    "labels": {
                      "de": "Finanzausgleich n.a.g.",
                      "fr": "Péréquation financière n.c.a.",
                      "it": "Perequazione finanziaria n.m.a.",
                      "en": "Fiscal equalization n.e.c."
                    },
                    "values": new Map(),
                    "children": []
                  }
                ]
              },
              {
                "code": "463",
                "labels": {
                  "de": "Beiträge von Gemeinwesen und Dritten",
                  "fr": "Contributions de collectivités publiques et tiers",
                  "it": "Contributi di enti pubblici e terzi",
                  "en": "Contributions from public authorities and third parties"
                },
                "values": new Map(),
                "children": [
                  {
                    "code": "4630",
                    "labels": {
                      "de": "Beiträge vom Bund",
                      "fr": "Contributions de la Confédération",
                      "it": "Contributi della Confederazione",
                      "en": "Contributions from the Confederation"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4631",
                    "labels": {
                      "de": "Beiträge von Kantonen und Konkordaten",
                      "fr": "Contributions des cantons et concordats",
                      "it": "Contributi di Cantoni e concordati",
                      "en": "Contributions from cantons and concordats"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4632",
                    "labels": {
                      "de": "Beiträge von Gemeinden und Gemeindezweckverbänden",
                      "fr": "Contributions des communes et syndicats intercommunaux",
                      "it": "Contributi di Comuni e consorzi comunali",
                      "en": "Contributions from municipalities and special purpose entities"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4633",
                    "labels": {
                      "de": "Beiträge von öffentlichen Sozialversicherungen",
                      "fr": "Contributions des assurances sociales publiques",
                      "it": "Contributi di assicurazioni sociali pubbliche",
                      "en": "Contributions from social security funds"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4634",
                    "labels": {
                      "de": "Beiträge von öffentlichen Unternehmen",
                      "fr": "Contributions des entreprises publiques",
                      "it": "Contributi di imprese pubbliche",
                      "en": "Contributions from public corporations"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4635",
                    "labels": {
                      "de": "Beiträge von privaten Unternehmen",
                      "fr": "Contributions des entreprises privées",
                      "it": "Contributi di imprese private",
                      "en": "Contributions from private corporations"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4636",
                    "labels": {
                      "de": "Beiträge von privaten Organisationen ohne Erwerbszweck",
                      "fr": "Contributions des organisations privées à but non lucratif",
                      "it": "Contributi di organizzazioni private senza scopo di lucro",
                      "en": "Contributions from private non-profit organizations"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4637",
                    "labels": {
                      "de": "Beiträge von privaten Haushalten",
                      "fr": "Contributions des ménages privés",
                      "it": "Contributi di economie domestiche private",
                      "en": "Contributions from households"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4638",
                    "labels": {
                      "de": "Beiträge aus dem Ausland",
                      "fr": "Contributions provenant de l'étranger",
                      "it": "Contributi dall’estero",
                      "en": "Contributions from abroad"
                    },
                    "values": new Map(),
                    "children": []
                  }
                ]
              },
              {
                "code": "466",
                "labels": {
                  "de": "Auflösung passivierte Investitionsbeiträge",
                  "fr": "Dissolution de contributions à des investissements portées au passif",
                  "it": "Scioglimento di contributi agli investimenti iscritti al passivo",
                  "en": "Dissolution of investment contributions posted as liabilities"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "469",
                "labels": {
                  "de": "Übriger Transferertrag",
                  "fr": "Autres revenus de transfert",
                  "it": "Rimanenti ricavi da riversamenti",
                  "en": "Other transfer revenue"
                },
                "values": new Map(),
                "children": []
              }
            ]
          },
          {
            "code": "48",
            "labels": {
              "de": "Ausserordentlicher Ertrag",
              "fr": "Revenus extraordinaires",
              "it": "Ricavi straordinari",
              "en": "Extraordinary revenue"
            },
            "values": new Map(),
            "children": [
              {
                "code": "481",
                "labels": {
                  "de": "Ausserordentliche Erträge von Regalien, Konzessionen",
                  "fr": "Revenus extraordinaires de patentes, concessions",
                  "it": "Ricavi straordinari da regalie e concessioni",
                  "en": "Extraordinary revenue from royalties, concessions"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "482",
                "labels": {
                  "de": "Ausserordentliche Entgelte",
                  "fr": "Compensations extraordinaires",
                  "it": "Ricavi e tasse straordinari",
                  "en": "Extraordinary revenue from exchange transactions"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "483",
                "labels": {
                  "de": "Ausserordentliche verschiedene Erträge",
                  "fr": "Revenus divers extraordinaires",
                  "it": "Diversi ricavi straordinari",
                  "en": "Extraordinary miscellaneous revenue"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "484",
                "labels": {
                  "de": "Ausserordentliche Finanzerträge",
                  "fr": "Revenus financiers extraordinaires",
                  "it": "Ricavi finanziari straordinari",
                  "en": "Extraordinary financial revenue"
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "485",
                "labels": {
                  "de": "",
                  "fr": "",
                  "it": "",
                  "en": ""
                },
                "values": new Map(),
                "children": []
              },
              {
                "code": "486",
                "labels": {
                  "de": "Ausserordentliche Transfererträge",
                  "fr": "Revenus de transfert extraordinaires",
                  "it": "Ricavi straordinari da riversamenti",
                  "en": "Extraordinary transfer revenue"
                },
                "values": new Map(),
                "children": [
                  {
                    "code": "4860",
                    "labels": {
                      "de": "Ausserordentliche Transfererträge, Bund",
                      "fr": "Revenus de transfert extraordinaires, Confédération",
                      "it": "Ricavi straordinari da riversamenti, Confederazione",
                      "en": "Extraordinary transfer revenue, Confederation"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4861",
                    "labels": {
                      "de": "Ausserordentliche Transfererträge, Kantone",
                      "fr": "Revenus de transfert extraordinaires, cantons",
                      "it": "Ricavi straordinari da riversamenti, Cantoni",
                      "en": "Extraordinary transfer revenue, cantons"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4862",
                    "labels": {
                      "de": "Ausserordentliche Transfererträge, Gemeinden",
                      "fr": "Revenus de transfert extraordinaires, communes",
                      "it": "Ricavi straordinari da riversamenti, Comuni",
                      "en": "Extraordinary transfer revenue, municipalities"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4863",
                    "labels": {
                      "de": "Ausserordentliche Transfererträge, öffentliche Sozialversicherungen",
                      "fr": "Revenus de transfert extraordinaires, assurances sociales publiques",
                      "it": "Ricavi straordinari da riversamenti, assicurazioni sociali pubbliche",
                      "en": "Extraordinary transfer revenue, social security funds"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4864",
                    "labels": {
                      "de": "Ausserordentliche Transfererträge, öffentliche Unternehmen",
                      "fr": "Revenus de transfert extraordinaires, entreprises publiques",
                      "it": "Ricavi straordinari da riversamenti, imprese pubbliche",
                      "en": "Extraordinary transfer revenue, public corporations"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4865",
                    "labels": {
                      "de": "Ausserordentliche Transfererträge, private Unternehmen",
                      "fr": "Revenus de transfert extraordinaires, entreprises privées",
                      "it": "Ricavi straordinari da riversamenti, imprese private",
                      "en": "Extraordinary transfer revenue, private corporations"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4866",
                    "labels": {
                      "de": "Ausserordentliche Transfererträge, private Organisationen ohne Erwerbszweck",
                      "fr": "Revenus de transfert extraordinaires, organisations privées à but non lucratif",
                      "it": "Ricavi straordinari da riversamenti, organizzazioni private senza scopo di lucro",
                      "en": "Extraordinary transfer revenue, private non-profit organizations"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4867",
                    "labels": {
                      "de": "Ausserordentliche Transfererträge, private Haushalte",
                      "fr": "Revenus de transfert extraordinaires, ménages privés",
                      "it": "Ricavi straordinari da riversamenti, economie domestiche private",
                      "en": "Extraordinary transfer revenue, households"
                    },
                    "values": new Map(),
                    "children": []
                  },
                  {
                    "code": "4868",
                    "labels": {
                      "de": "Ausserordentliche Transfererträge, Ausland",
                      "fr": "Revenus de transfert extraordinaires, étranger",
                      "it": "Ricavi straordinari da riversamenti, estero",
                      "en": "Extraordinary transfer revenue, abroad"
                    },
                    "values": new Map(),
                    "children": []
                  }
                ]
              },
              {
                "code": "487",
                "labels": {
                  "de": "Zusätzliche Auflösung passivierter Investitionsbeiträge",
                  "fr": "Dissolution supplémentaire des subventions d’investissement portées au passif",
                  "it": "Scioglimento supplementare di contributi agli investimenti iscritti al passivo",
                  "en": "Additional dissolution of investment contributions, capitalized or posted as liabilities"
                },
                "values": new Map(),
                "children": [
                  {
                    "code": "4870",
                    "labels": {
                      "de": "Zusätzliche Auflösung passivierter Investitionsbeiträge",
                      "fr": "Dissolution supplémentaire des subventions d’investissement portées au passif",
                      "it": "Scioglimento supplementare di contributi agli investimenti iscritti al passivo",
                      "en": "Additional dissolution of investment contributions, capitalized or posted as liabilities"
                    },
                    "values": new Map(),
                    "children": []
                  }
                ]
              },
              {
                "code": "489",
                "labels": {
                  "de": "Entnahmen aus dem Eigenkapital",
                  "fr": "Prélèvements sur le capital propre",
                  "it": "Prelievi dal capitale proprio",
                  "en": "Withdrawals from net assets/equity"
                },
                "values": new Map(),
                "children": []
              }
            ]
          }
        ]
      }
    ]
  },
  "usedCodes": [],
  "unusedCodes": [],
  "entities": new Map(),
  "metadata": {
    "source": "Generated from code definitions",
    "loadedAt": "2025-06-05T09:45:12.538Z",
    "recordCount": 0
  }
};
}

/**
 * Get the empty FinancialData structure as a plain object (for JSON serialization)
 */
export function getEmptyFinancialDataStructureAsObject() {
  return {
  "balanceSheet": {
    "code": "root",
    "labels": {
      "de": "Gesamt",
      "fr": "Total",
      "it": "Totale",
      "en": "Total"
    },
    "values": {},
    "children": [
      {
        "code": "1",
        "labels": {
          "de": "Aktiven",
          "fr": "Actif",
          "it": "Attivi",
          "en": "Assets"
        },
        "values": {},
        "children": [
          {
            "code": "10",
            "labels": {
              "de": "Finanzvermögen",
              "fr": "Patrimoine financier",
              "it": "Beni patrimoniali",
              "en": "Non-administrative assets"
            },
            "values": {},
            "children": [
              {
                "code": "100",
                "labels": {
                  "de": "Flüssige Mittel und kurzfristige Geldanlagen",
                  "fr": "Liquidités et placements à court terme",
                  "it": "Liquidità e investimenti di denaro a breve termine",
                  "en": "Cash and cash equivalents"
                },
                "values": {},
                "children": []
              },
              {
                "code": "101",
                "labels": {
                  "de": "Forderungen",
                  "fr": "Créances",
                  "it": "Crediti",
                  "en": "Receivables"
                },
                "values": {},
                "children": []
              },
              {
                "code": "102",
                "labels": {
                  "de": "Kurzfristige Finanzanlagen",
                  "fr": "Placements financiers à court terme",
                  "it": "Investimenti finanziari a breve termine",
                  "en": "Short-term financial investments"
                },
                "values": {},
                "children": []
              },
              {
                "code": "104",
                "labels": {
                  "de": "Aktive Rechnungsabgrenzungen",
                  "fr": "Comptes de régularisation actifs",
                  "it": "Delimitazioni contabili attive",
                  "en": "Prepaid expenses and accrued income"
                },
                "values": {},
                "children": []
              },
              {
                "code": "106",
                "labels": {
                  "de": "Vorräte und angefangene Arbeiten",
                  "fr": "Stocks et travaux en cours",
                  "it": "Scorte e lavori in corso",
                  "en": "Inventories and work in progress"
                },
                "values": {},
                "children": []
              },
              {
                "code": "107",
                "labels": {
                  "de": "Langfristige Finanzanlagen",
                  "fr": "Placements financiers à long terme",
                  "it": "Investimenti finanziari a lungo termine",
                  "en": "Long-term financial investments"
                },
                "values": {},
                "children": []
              },
              {
                "code": "108",
                "labels": {
                  "de": "Sachanlagen, FV",
                  "fr": "Immobilisations corporelles, PF",
                  "it": "Investimenti materiali, beni patrimoniali",
                  "en": "Tangible fixed assets, NAA"
                },
                "values": {},
                "children": []
              },
              {
                "code": "109",
                "labels": {
                  "de": "Forderungen gegenüber Spezialfinanzierungen und Fonds im Fremdkapital",
                  "fr": "Créances sur les financements spéciaux et fonds enregistrés sous les capitaux de tiers",
                  "it": "Crediti nei confronti di finanziamenti speciali e di fondi nel capitale di terzi",
                  "en": "Receivables from special financing and funds in liabilities"
                },
                "values": {},
                "children": []
              }
            ]
          },
          {
            "code": "14",
            "labels": {
              "de": "Verwaltungsvermögen",
              "fr": "Patrimoine administratif",
              "it": "Beni amministrativi",
              "en": "Administrative assets"
            },
            "values": {},
            "children": [
              {
                "code": "140",
                "labels": {
                  "de": "Sachanlagen, VV",
                  "fr": "Immobilisations corporelles, PA",
                  "it": "Investimenti materiali, beni amministrativi",
                  "en": "Tangible fixed assets, AA"
                },
                "values": {},
                "children": []
              },
              {
                "code": "141",
                "labels": {
                  "de": "Vorräte, VV",
                  "fr": "Stocks, PA",
                  "it": "Scorte, beni amministrativi",
                  "en": "Inventories, AA"
                },
                "values": {},
                "children": []
              },
              {
                "code": "142",
                "labels": {
                  "de": "Immaterielle Anlagen",
                  "fr": "Immobilisations incorporelles",
                  "it": "Investimenti immateriali",
                  "en": "Intangible fixed assets"
                },
                "values": {},
                "children": []
              },
              {
                "code": "143",
                "labels": {
                  "de": "Darlehen und Beteiligungen n.a.g.",
                  "fr": "Prêts et participations n.c.a.",
                  "it": "Mutui e partecipazioni n.m.a.",
                  "en": "Loans and financial interests n.e.c."
                },
                "values": {},
                "children": []
              },
              {
                "code": "144",
                "labels": {
                  "de": "Darlehen",
                  "fr": "Prêts",
                  "it": "Mutui",
                  "en": "Loans"
                },
                "values": {},
                "children": []
              },
              {
                "code": "145",
                "labels": {
                  "de": "Beteiligungen, Grundkapitalien",
                  "fr": "Participations, capital social",
                  "it": "Partecipazioni, capitali sociali",
                  "en": "Financial interests, share capital"
                },
                "values": {},
                "children": []
              },
              {
                "code": "146",
                "labels": {
                  "de": "Investitionsbeiträge",
                  "fr": "Contributions à des investissements",
                  "it": "Contributi agli investimenti",
                  "en": "Investment contributions"
                },
                "values": {},
                "children": []
              },
              {
                "code": "147",
                "labels": {
                  "de": "Guthaben gegenüber öffentlichen Haushalten",
                  "fr": "Créances sur les administrations publiques",
                  "it": "Averi verso le amministrazioni pubbliche",
                  "en": "Assets due from government units"
                },
                "values": {},
                "children": []
              },
              {
                "code": "148",
                "labels": {
                  "de": "Kumulierte zusätzliche Abschreibungen",
                  "fr": "Amortissements supplémentaires cumulés",
                  "it": "Ammortamenti supplementari cumulati",
                  "en": "Accumulated additional depreciation and amortization"
                },
                "values": {},
                "children": []
              }
            ]
          }
        ]
      },
      {
        "code": "2",
        "labels": {
          "de": "Passiven",
          "fr": "Passif",
          "it": "Passivi",
          "en": "Liabilities and equity"
        },
        "values": {},
        "children": [
          {
            "code": "20",
            "labels": {
              "de": "Fremdkapital",
              "fr": "Capitaux de tiers",
              "it": "Capitale di terzi",
              "en": "Liabilities"
            },
            "values": {},
            "children": [
              {
                "code": "200",
                "labels": {
                  "de": "Laufende Verbindlichkeiten",
                  "fr": "Engagements courants",
                  "it": "Impegni correnti",
                  "en": "Current liabilities"
                },
                "values": {},
                "children": []
              },
              {
                "code": "201",
                "labels": {
                  "de": "Kurzfristige Finanzverbindlichkeiten",
                  "fr": "Engagements financiers à court terme",
                  "it": "Impegni finanziari a breve termine",
                  "en": "Short-term financial liabilities"
                },
                "values": {},
                "children": []
              },
              {
                "code": "204",
                "labels": {
                  "de": "Passive Rechnungsabgrenzungen",
                  "fr": "Comptes de régularisation passifs",
                  "it": "Delimitazioni contabili passive",
                  "en": "Accrued expenses and deferred income"
                },
                "values": {},
                "children": []
              },
              {
                "code": "205",
                "labels": {
                  "de": "Kurzfristige Rückstellungen",
                  "fr": "Provisions à court terme",
                  "it": "Accantonamenti a breve termine",
                  "en": "Short-term provisions"
                },
                "values": {},
                "children": []
              },
              {
                "code": "206",
                "labels": {
                  "de": "Langfristige Finanzverbindlichkeiten",
                  "fr": "Engagements financiers à long terme",
                  "it": "Impegni a lungo termine",
                  "en": "Long-term financial liabilities"
                },
                "values": {},
                "children": []
              },
              {
                "code": "207",
                "labels": {
                  "de": "Verbindlichkeiten gegenüber öffentlichen Haushalten",
                  "fr": "Engagements envers les administrations publiques",
                  "it": "Impegni nei confronti delle amministrazioni pubbliche",
                  "en": "Liabilities toward government units"
                },
                "values": {},
                "children": []
              },
              {
                "code": "208",
                "labels": {
                  "de": "Langfristige Rückstellungen",
                  "fr": "Provisions à long terme",
                  "it": "Accantonamenti a lungo termine",
                  "en": "Long-term provisions"
                },
                "values": {},
                "children": []
              },
              {
                "code": "209",
                "labels": {
                  "de": "Zweckgebundene Mittel/Fonds",
                  "fr": "Fonds affectés",
                  "it": "Mezzi/Fondi a destinazione vincolata",
                  "en": "Restricted funds"
                },
                "values": {},
                "children": []
              }
            ]
          },
          {
            "code": "29",
            "labels": {
              "de": "Eigenkapital",
              "fr": "Capital propre",
              "it": "Capitale proprio",
              "en": "Net assets/equity"
            },
            "values": {},
            "children": [
              {
                "code": "290",
                "labels": {
                  "de": "Spezialfinanzierungen und Fonds und Eigenkapital",
                  "fr": "Financements spéciaux et fonds enregistrés sous le capital propre",
                  "it": "Finanziamenti speciali e di fondi nel capitale proprio",
                  "en": "Special financing and funds in net assets/equity"
                },
                "values": {},
                "children": []
              },
              {
                "code": "292",
                "labels": {
                  "de": "Rücklagen der Globalbudgetbereiche",
                  "fr": "Réserves des domaines de l'enveloppe budgétaire",
                  "it": "Riserve dei settori del preventivo globale",
                  "en": "Global budget area reserves"
                },
                "values": {},
                "children": []
              },
              {
                "code": "293",
                "labels": {
                  "de": "Vorfinanzierungen",
                  "fr": "Préfinancements",
                  "it": "Prefinanziamenti",
                  "en": "Advance financing"
                },
                "values": {},
                "children": []
              },
              {
                "code": "294",
                "labels": {
                  "de": "Finanzpolitische Reserven",
                  "fr": "Réserves de politique budgétaire",
                  "it": "Riserve di politica finanziaria",
                  "en": "Fiscal policy reserves"
                },
                "values": {},
                "children": []
              },
              {
                "code": "295",
                "labels": {
                  "de": "Aufwertungsreserve",
                  "fr": "Réserve liée au retraitement",
                  "it": "Riserva di rivalutazione",
                  "en": "Restatement reserve"
                },
                "values": {},
                "children": []
              },
              {
                "code": "296",
                "labels": {
                  "de": "Neubewertungsreserve Finanzvermögen",
                  "fr": "Réserve liée à la réévaluation du patrimoine financier",
                  "it": "Riserva di nuova valutazione dei beni patrimoniali",
                  "en": "Revaluation reserve, non-administrative assets"
                },
                "values": {},
                "children": []
              },
              {
                "code": "298",
                "labels": {
                  "de": "Übriges Eigenkapital",
                  "fr": "Autre capital propre",
                  "it": "Rimanente capitale proprio",
                  "en": "Other net assets/equity"
                },
                "values": {},
                "children": []
              },
              {
                "code": "299",
                "labels": {
                  "de": "Bilanzüberschuss/-fehlbetrag",
                  "fr": "Excédent/découvert du bilan",
                  "it": "Eccedenza/Disavanzo di bilancio",
                  "en": "Accumulated surplus/deficit"
                },
                "values": {},
                "children": []
              }
            ]
          }
        ]
      }
    ]
  },
  "incomeStatement": {
    "code": "root",
    "labels": {
      "de": "Erfolgsrechnung",
      "fr": "Compte de résultats",
      "it": "Conto economico",
      "en": "Income Statement"
    },
    "values": {},
    "children": [
      {
        "code": "3",
        "labels": {
          "de": "Aufwand",
          "fr": "Charges",
          "it": "Spese",
          "en": "Expenses"
        },
        "values": {},
        "children": [
          {
            "code": "30",
            "labels": {
              "de": "Personalaufwand",
              "fr": "Charges de personnel",
              "it": "Spese per il personale",
              "en": "Personnel expenses"
            },
            "values": {},
            "children": [
              {
                "code": "300",
                "labels": {
                  "de": "Behörden, Kommissionen und Richter",
                  "fr": "Autorités, commissions et juges",
                  "it": "Autorità, commissioni e giudici",
                  "en": "Authorities, commissions and judges"
                },
                "values": {},
                "children": []
              },
              {
                "code": "301",
                "labels": {
                  "de": "Löhne des Verwaltungs- und Betriebspersonals",
                  "fr": "Salaires du personnel administratif et d'exploitation",
                  "it": "Stipendi del personale amministrativo e d'esercizio",
                  "en": "Salaries of administrative and operating personnel"
                },
                "values": {},
                "children": []
              },
              {
                "code": "302",
                "labels": {
                  "de": "Löhne der Lehrpersonen",
                  "fr": "Salaires des enseignants",
                  "it": "Stipendi del corpo docenti",
                  "en": "Salaries of teaching staff"
                },
                "values": {},
                "children": []
              },
              {
                "code": "303",
                "labels": {
                  "de": "Temporäre Arbeitskräfte",
                  "fr": "Travailleurs temporaires",
                  "it": "Personale temporaneo",
                  "en": "Temporary staff"
                },
                "values": {},
                "children": []
              },
              {
                "code": "304",
                "labels": {
                  "de": "Zulagen",
                  "fr": "Allocations",
                  "it": "Assegni e indennità",
                  "en": "Allowances"
                },
                "values": {},
                "children": []
              },
              {
                "code": "305",
                "labels": {
                  "de": "Arbeitgeberbeiträge",
                  "fr": "Cotisations de l'employeur",
                  "it": "Contributi del datore di lavoro",
                  "en": "Employer contributions"
                },
                "values": {},
                "children": []
              },
              {
                "code": "306",
                "labels": {
                  "de": "Arbeitgeberleistungen",
                  "fr": "Prestations de l'employeur",
                  "it": "Prestazioni del datore di lavoro",
                  "en": "Employer benefits"
                },
                "values": {},
                "children": []
              },
              {
                "code": "309",
                "labels": {
                  "de": "Übriger Personalaufwand",
                  "fr": "Autres charges de personnel",
                  "it": "Rimanenti spese per il personale",
                  "en": "Other personnel expenses"
                },
                "values": {},
                "children": []
              }
            ]
          },
          {
            "code": "31",
            "labels": {
              "de": "Sach- und übriger Betriebsaufwand",
              "fr": "Charges de biens et services et autres charges d'exploitation",
              "it": "Spese per beni e servizi e altre spese d’esercizio",
              "en": "General, administrative and operating expenses"
            },
            "values": {},
            "children": [
              {
                "code": "310",
                "labels": {
                  "de": "Material- und Warenaufwand",
                  "fr": "Charges de matériel et de marchandises",
                  "it": "Spese per materiale e merci",
                  "en": "Cost of goods and materials"
                },
                "values": {},
                "children": []
              },
              {
                "code": "311",
                "labels": {
                  "de": "Nicht aktivierbare Anlagen",
                  "fr": "Immobilisations non portées à l'actif",
                  "it": "Investimenti non attivabili",
                  "en": "Non-capitalized assets"
                },
                "values": {},
                "children": []
              },
              {
                "code": "312",
                "labels": {
                  "de": "Ver- und Entsorgung Liegenschaften VV",
                  "fr": "Approvisionnement et élimination",
                  "it": "Approvvigionamento e smaltimento di immobili beni amministrativi",
                  "en": "Supply and disposal"
                },
                "values": {},
                "children": []
              },
              {
                "code": "313",
                "labels": {
                  "de": "Dienstleistungen und Honorare",
                  "fr": "Prestations de service et honoraires",
                  "it": "Prestazioni di servizi e onorari",
                  "en": "Services and fees"
                },
                "values": {},
                "children": []
              },
              {
                "code": "314",
                "labels": {
                  "de": "Baulicher und betrieblicher Unterhalt",
                  "fr": "Travaux d'entretien",
                  "it": "Manutenzione edile e d'esercizio",
                  "en": "Building maintenance"
                },
                "values": {},
                "children": []
              },
              {
                "code": "315",
                "labels": {
                  "de": "Unterhalt Mobilien und immaterielle Anlagen",
                  "fr": "Entretien des biens meubles et immobilisations incorporelles",
                  "it": "Manutenzione di beni mobili e investimenti immateriali",
                  "en": "Upkeep of movables and intangible fixed assets"
                },
                "values": {},
                "children": []
              },
              {
                "code": "316",
                "labels": {
                  "de": "Mieten, Leasing, Pachten, Benützungsgebühren",
                  "fr": "Loyers, leasing, fermages, émoluments d'utilisation",
                  "it": "Pigioni, leasing, fitti, emolumenti di utilizzazione",
                  "en": "Rental, lease, tenancy, user charges"
                },
                "values": {},
                "children": []
              },
              {
                "code": "317",
                "labels": {
                  "de": "Spesenentschädigungen",
                  "fr": "Remboursement des frais",
                  "it": "Indennità per il rimborso spese",
                  "en": "Compensation for expenses"
                },
                "values": {},
                "children": []
              },
              {
                "code": "318",
                "labels": {
                  "de": "Wertberichtigungen auf Forderungen",
                  "fr": "Réévaluation de créances",
                  "it": "Rettificazioni di valore su crediti",
                  "en": "Value adjustments on receivables"
                },
                "values": {},
                "children": []
              },
              {
                "code": "319",
                "labels": {
                  "de": "Übriger Betriebsaufwand",
                  "fr": "Autres charges d'exploitation",
                  "it": "Rimanenti spese d'esercizio",
                  "en": "Other operating expenses"
                },
                "values": {},
                "children": []
              }
            ]
          },
          {
            "code": "32",
            "labels": {
              "de": "Rüstungsaufwand",
              "fr": "Charges d'armement",
              "it": "Spese per l'armamento",
              "en": "Defense expenses"
            },
            "values": {},
            "children": [
              {
                "code": "320",
                "labels": {
                  "de": "Rüstungsaufwand",
                  "fr": "Charges d'armement",
                  "it": "Spese per l'armamento",
                  "en": "Defense expenses"
                },
                "values": {},
                "children": []
              }
            ]
          },
          {
            "code": "33",
            "labels": {
              "de": "Abschreibungen auf das Verwaltungsvermögen",
              "fr": "Amortissement du patrimoine administratif",
              "it": "Ammortamenti sui beni amministrativi",
              "en": "Depreciation, administrative assets"
            },
            "values": {},
            "children": [
              {
                "code": "331",
                "labels": {
                  "de": "Abschreibungen n.a.g.",
                  "fr": "Amortissements n.c.a.",
                  "it": "Ammortamenti n.m.a.",
                  "en": "Depreciation and amortization n.e.c."
                },
                "values": {},
                "children": []
              },
              {
                "code": "337",
                "labels": {
                  "de": "Planmässige Abschreibungen",
                  "fr": "Amortissements planifiés",
                  "it": "Ammortamenti pianificati",
                  "en": "Planned depreciation and amortization"
                },
                "values": {},
                "children": []
              },
              {
                "code": "338",
                "labels": {
                  "de": "Ausserplanmässige Abschreibungen",
                  "fr": "Amortissements non planifiés",
                  "it": "Ammortamenti non pianificati",
                  "en": "Unplanned depreciation and amortization"
                },
                "values": {},
                "children": []
              }
            ]
          },
          {
            "code": "34",
            "labels": {
              "de": "Finanzaufwand",
              "fr": "Charges financières",
              "it": "Spese finanziarie",
              "en": "Financial expense"
            },
            "values": {},
            "children": [
              {
                "code": "340",
                "labels": {
                  "de": "Zinsaufwand",
                  "fr": "Charges d'intérêts",
                  "it": "Spese a titolo di interessi",
                  "en": "Interest expense"
                },
                "values": {},
                "children": []
              },
              {
                "code": "341",
                "labels": {
                  "de": "Realisierte Verluste FV",
                  "fr": "Pertes réalisées PF",
                  "it": "Perdite conseguite beni patrimoniali",
                  "en": "Realized losses NAA"
                },
                "values": {},
                "children": []
              },
              {
                "code": "342",
                "labels": {
                  "de": "Kapitalbeschaffung und -verwaltung",
                  "fr": "Acquisition et administration de capital",
                  "it": "Raccolta e gestione di capitale",
                  "en": "Capital procurement and administration"
                },
                "values": {},
                "children": []
              },
              {
                "code": "343",
                "labels": {
                  "de": "Liegenschaftenaufwand, FV",
                  "fr": "Charges d'immeubles, PF",
                  "it": "Spese per immobili, beni patrimoniali",
                  "en": "Real estate expense, NAA"
                },
                "values": {},
                "children": []
              },
              {
                "code": "344",
                "labels": {
                  "de": "Wertberichtigungen Anlagen, FV",
                  "fr": "Réévaluation d'immobilisations, PF",
                  "it": "Rettificazioni di valore su investimenti, beni patrimoniali",
                  "en": "Value adjustments on investments, NAA"
                },
                "values": {},
                "children": []
              },
              {
                "code": "349",
                "labels": {
                  "de": "Übriger Finanzaufwand",
                  "fr": "Autres charges financières",
                  "it": "Rimanenti spese finanziarie",
                  "en": "Other financial expense"
                },
                "values": {},
                "children": []
              }
            ]
          },
          {
            "code": "35",
            "labels": {
              "de": "Einlagen in Fonds und Spezialfinanzierungen",
              "fr": "Apports aux fonds et financements spéciaux",
              "it": "Versamenti a fondi e a finanziamenti speciali",
              "en": "Net expense for funds and special financing"
            },
            "values": {},
            "children": [
              {
                "code": "350",
                "labels": {
                  "de": "Einlagen in Fonds und Spezialfinanzierungen im Fremdkapital",
                  "fr": "Apports aux fonds et financements spéciaux enregistrés sous capitaux de tiers",
                  "it": "Versamenti a fondi e a finanziamenti speciali nel capitale di terzi",
                  "en": "Net expense for funds and special financing in liabilities"
                },
                "values": {},
                "children": []
              },
              {
                "code": "351",
                "labels": {
                  "de": "Einlagen in Fonds und Spezialfinanzierungen im Eigenkapital",
                  "fr": "Apports aux fonds et financements spéciaux enregistrés sous le capital propre",
                  "it": "Versamenti a fondi e a finanziamenti speciali nel capitale proprio",
                  "en": "Net expense for funds and special financing in net assets/equity"
                },
                "values": {},
                "children": []
              },
              {
                "code": "352",
                "labels": {
                  "de": "Einlagen in Fonds und Spezialfinanzierungen n.a.g.",
                  "fr": "Apports aux fonds et financements spéciaux n.c.a.",
                  "it": "Versamenti a fondi e a finanziamenti speciali n.m.a.",
                  "en": "Net expense for funds and special financing n.e.c."
                },
                "values": {},
                "children": []
              }
            ]
          },
          {
            "code": "36",
            "labels": {
              "de": "Transferaufwand",
              "fr": "Charges de transfert",
              "it": "Spese di riversamento",
              "en": "Transfer expenses"
            },
            "values": {},
            "children": [
              {
                "code": "360",
                "labels": {
                  "de": "Ertragsanteile",
                  "fr": "Parts de revenus",
                  "it": "Partecipazioni a ricavi",
                  "en": "Revenue shares"
                },
                "values": {},
                "children": [
                  {
                    "code": "3600",
                    "labels": {
                      "de": "Ertragsanteile an Bund",
                      "fr": "Parts de revenus destinées à la Confédération",
                      "it": "Partecipazioni della Confederazione a ricavi",
                      "en": "Revenue shares for the Confederation"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "3601",
                    "labels": {
                      "de": "Ertragsanteile an Kantone und Konkordate",
                      "fr": "Parts de revenus destinées aux cantons et aux concordats",
                      "it": "Partecipazioni di Cantoni e Concordati a ricavi",
                      "en": "Revenue shares for cantons and concordats"
                    },
                    "values": {},
                    "children": [
                      {
                        "code": "36010",
                        "labels": {
                          "de": "Ertragsanteil direkte Bundessteuer",
                          "fr": "Part des revenus de l'impôt fédéral direct",
                          "it": "Partecipazioni a ricavi, imposta federale diretta",
                          "en": "Share in direct federal tax revenue"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "36011",
                        "labels": {
                          "de": "Ertragsanteil Verrechnungssteuer",
                          "fr": "Part des revenus de l'impôt anticipé",
                          "it": "Partecipazioni a ricavi, imposta preventiva",
                          "en": "Share in withholding tax revenue"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "36012",
                        "labels": {
                          "de": "Ertragsanteil Wehrpflichtersatzabgabe",
                          "fr": "Part des revenus de la taxe d'exemption de l'obligation de servir",
                          "it": "Partecipazioni a ricavi, tassa d'esenzione dall'obbligo militare",
                          "en": "Share in military service exemption tax revenue"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "36013",
                        "labels": {
                          "de": "Ertraganteil Eidg. Alkoholverwaltung",
                          "fr": "Part des revenus de la Régie fédérale des alcools",
                          "it": "Partecipazioni a ricavi, Regìa federale degli alcool",
                          "en": "Share in Swiss Alcohol Board revenue"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "36014",
                        "labels": {
                          "de": "Ertraganteil Eidg. Bussen und Taxen",
                          "fr": "Part des revenus des amendes et taxes fédérales",
                          "it": "Partecipazioni a ricavi, multe e tasse federali",
                          "en": "Share in revenue from federal fines and duties"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "36015",
                        "labels": {
                          "de": "Ertraganteil Eidg. Mineralölsteuer",
                          "fr": "Part des revenus de l'impôt fédéral sur les huiles minérales",
                          "it": "Partecipazioni a ricavi, imposta federale sugli oli minerali",
                          "en": "Share in federal mineral oil tax revenue"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "36016",
                        "labels": {
                          "de": "Ertraganteil Eidg. Stempelabgabe",
                          "fr": "Part des revenus des droits de timbre fédéraux",
                          "it": "Partecipazioni a ricavi, tasse di bollo federali",
                          "en": "Share in federal stamp duty revenue"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "36017",
                        "labels": {
                          "de": "Ertraganteil EU-Zinsbesteuerung",
                          "fr": "Part des revenus de la fiscalité de l'épargne UE",
                          "it": "Partecipazioni a ricavi, fiscalità del risparmio UE",
                          "en": "Share in EU savings tax revenue"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "36018",
                        "labels": {
                          "de": "Ertraganteil LSVA",
                          "fr": "Part des revenus de la RPLP",
                          "it": "Partecipazioni a ricavi, TTPCP",
                          "en": "Share in mileage-related heavy vehicle charge revenue"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "36019",
                        "labels": {
                          "de": "Ertraganteil übriger Bundeseinnahmen",
                          "fr": "Part des autres recettes de la Confédération",
                          "it": "Partecipazioni a ricavi, rimanenti entrate della Confederazione",
                          "en": "Share in revenue from other federal receipts"
                        },
                        "values": {},
                        "children": []
                      }
                    ]
                  },
                  {
                    "code": "3602",
                    "labels": {
                      "de": "Ertragsanteile Gemeinden und Gemeindezweckverbände",
                      "fr": "Parts de revenus destinées aux communes et syndicats intercommunaux",
                      "it": "Partecipazioni di Comuni e consorzi comunali a ricavi",
                      "en": "Revenue shares for municipalities and special purpose entities"
                    },
                    "values": {},
                    "children": [
                      {
                        "code": "36021",
                        "labels": {
                          "de": "Gemeindeanteile an kantonalen Steuern",
                          "fr": "Parts des impôts cantonaux revenant aux communes",
                          "it": "Partecipazioni di Comuni alle imposte cantonali",
                          "en": "Municipalities' share in cantonal taxes"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "36022",
                        "labels": {
                          "de": "Gemeindeanteile an Regalien und Konzessionen",
                          "fr": "Parts des patentes et concessions revenant aux communes",
                          "it": "Partecipazioni di Comuni a regalie e concessioni",
                          "en": "Municipalities' share in royalties and concessions"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "36023",
                        "labels": {
                          "de": "Gemeindeanteile an kantonalen Gebühren",
                          "fr": "Parts des émoluments cantonaux revenant aux communes",
                          "it": "Partecipazioni di Comuni a emolumenti cantonali",
                          "en": "Municipalities' share in cantonal fees"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "36029",
                        "labels": {
                          "de": "Gemeindeanteile an übrigen kantonalen Erträgen",
                          "fr": "Parts des autres revenus cantonaux revenant aux communes",
                          "it": "Partecipazioni di Comuni ai rimanenti ricavi cantonali",
                          "en": "Municipalities' share in other cantonal revenue"
                        },
                        "values": {},
                        "children": []
                      }
                    ]
                  },
                  {
                    "code": "3603",
                    "labels": {
                      "de": "Ertragsanteile an öffentlichen Sozialversicherungen",
                      "fr": "Parts de revenus destinées aux assurances sociales publiques",
                      "it": "Partecipazioni di assicurazioni sociali pubbliche a ricavi",
                      "en": "Revenue shares for social security funds"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "3604",
                    "labels": {
                      "de": "Ertragsanteile an öffentlichen Unternehmen",
                      "fr": "Parts de revenus destinées aux entreprises publiques",
                      "it": "Partecipazioni di imprese pubbliche a ricavi",
                      "en": "Revenue shares for public corporations"
                    },
                    "values": {},
                    "children": []
                  }
                ]
              },
              {
                "code": "361",
                "labels": {
                  "de": "Entschädigungen",
                  "fr": "Indemnités",
                  "it": "Indennizzi",
                  "en": "Compensation"
                },
                "values": {},
                "children": [
                  {
                    "code": "3610",
                    "labels": {
                      "de": "Entschädigungen an Bund",
                      "fr": "Indemnités à la Confédération",
                      "it": "Indennizzi alla Confederazione",
                      "en": "Compensation for the Confederation"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "3611",
                    "labels": {
                      "de": "Entschädigungen an Kantone und Konkordate",
                      "fr": "Indemnités aux cantons et aux concordats",
                      "it": "Indennizzi a Cantoni e Concordati",
                      "en": "Compensation for cantons and concordats"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "3612",
                    "labels": {
                      "de": "Entschädigungen an Gemeinden und Gemeindezweckverbände",
                      "fr": "Indemnités aux communes et aux syndicats intercommunaux",
                      "it": "Indennizzi a Comuni e consorzi comunali",
                      "en": "Compensation for municipalities and special purpose entities"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "3613",
                    "labels": {
                      "de": "Entschädigungen an öffentliche Sozialversicherungen",
                      "fr": "Indemnités aux assurances sociales publiques",
                      "it": "Indennizzi ad assicurazioni sociali pubbliche",
                      "en": "Compensation for social security funds"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "3614",
                    "labels": {
                      "de": "Entschädigungen an öffentlichen Unternehmen",
                      "fr": "Indemnités aux entreprises publiques",
                      "it": "Indennizzi a imprese pubbliche",
                      "en": "Compensation for public corporations"
                    },
                    "values": {},
                    "children": []
                  }
                ]
              },
              {
                "code": "362",
                "labels": {
                  "de": "Finanz- und Lastenausgleich",
                  "fr": "Péréquation financière et compensation des charges",
                  "it": "Perequazione finanziaria e compensazione degli oneri",
                  "en": "Fiscal equalization and cost compensation"
                },
                "values": {},
                "children": [
                  {
                    "code": "3620",
                    "labels": {
                      "de": "Finanz- und Lastenausgleich an Bund",
                      "fr": "Péréquation financière et compensation des charges à la Confédération",
                      "it": "Perequazione finanziaria e compensazione degli oneri alla Confederazione",
                      "en": "Fiscal equalization and cost compensation for the Confederation"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "3621",
                    "labels": {
                      "de": "Finanz- und Lastenausgleich an Kantone",
                      "fr": "Péréquation financière et compensation des charges aux cantons",
                      "it": "Perequazione finanziaria e compensazione degli oneri a Cantoni e concordati",
                      "en": "Fiscal equalization and cost compensation for cantons"
                    },
                    "values": {},
                    "children": [
                      {
                        "code": "36211",
                        "labels": {
                          "de": "Ressourcenausgleich",
                          "fr": "Péréquation des ressources",
                          "it": "Perequazione delle risorse",
                          "en": "Resource equalization"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "36212",
                        "labels": {
                          "de": "Sozio-demografischer Lastenausgleich",
                          "fr": "Compensation des charges excessives dues à des facteurs socio-démographiques",
                          "it": "Compensazione degli oneri eccessivi dovuti a fattori sociodemografici",
                          "en": "Socio-demographic cost compensation"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "36213",
                        "labels": {
                          "de": "Geografisch-topografischer Lastenausgleich",
                          "fr": "Compensation des charges excessives dues à des facteurs géo-topographiques",
                          "it": "Compensazione degli oneri eccessivi dovuti a fattori geotopografici",
                          "en": "Geographical/topographic cost compensation"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "36214",
                        "labels": {
                          "de": "Härteausgleich",
                          "fr": "Compensation des cas de rigueur",
                          "it": "Compensazione dei casi di rigore",
                          "en": "Cohesion fund"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "36215",
                        "labels": {
                          "de": "Vertikaler Finanzausgleich von Gemeinde an Kanton",
                          "fr": "Péréquation financière verticale des communes au canton",
                          "it": "Perequazione finanziaria verticale da Comuni a Cantone",
                          "en": "Vertical fiscal equalization between municipalities and cantons"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "36216",
                        "labels": {
                          "de": "Vertikaler Lastenausgleich von Gemeinde an Kanton",
                          "fr": "Compensation verticale des charges des communes au canton",
                          "it": "Compensazione verticale degli oneri da Comuni a Cantone",
                          "en": "Vertical cost compensation between municipalities and cantons"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "36217",
                        "labels": {
                          "de": "Weitergabe Ressourcen- und Härteausgleich der Geberkantone",
                          "fr": "Transmission de la péréquation des ressources et compensation des cas de rigueur des cantons contributeurs",
                          "it": "Trasferimento dai Cantoni donatori della perequazione delle risorse e compensazione dei casi di rigore",
                          "en": "Forwarding of resource equalization and cohesion fund from donor cantons"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "36219",
                        "labels": {
                          "de": "Übrige Massnahmen des Finanzausgleichs",
                          "fr": "Autres mesures liées à la péréquation financière",
                          "it": "Rimanenti misure della perequazione finanziaria",
                          "en": "Other measures of the fiscal equalization"
                        },
                        "values": {},
                        "children": []
                      }
                    ]
                  },
                  {
                    "code": "3622",
                    "labels": {
                      "de": "Finanz- und Lastenausgleich an Gemeinden",
                      "fr": "Péréquation financière et compensation des charges aux communes",
                      "it": "Perequazione finanziaria e compensazione degli oneri a Comuni",
                      "en": "Fiscal equalization and cost compensation for municipalities"
                    },
                    "values": {},
                    "children": [
                      {
                        "code": "36221",
                        "labels": {
                          "de": "Weitergabe eines Anteils am Ressourcenausgleich an Gemeinden",
                          "fr": "Transmission d'une part de la péréquation des ressources aux communes",
                          "it": "Trasferimento ai Comuni di una percentuale della perequazione delle risorse",
                          "en": "Forwarding of a share in resource equalization to municipalities"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "36222",
                        "labels": {
                          "de": "Weitergabe eines Anteils am sozio-demografischen Ausgleich an Gemeinden",
                          "fr": "Transmission d'une part de la compensation des charges excessives dues à des facteurs socio-démographiques aux communes",
                          "it": "Trasferimento ai Comuni di una percentuale della perequazione sociodemografica",
                          "en": "Forwarding of a share in socio-demographic equalization to municipalities"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "36223",
                        "labels": {
                          "de": "Weitergabe eines Anteils am geografisch-topografischen Ausgleich an Gemeinden",
                          "fr": "Transmission d'une part de la compensation des charges excessives dues à des facteurs géo-topographiques aux communes",
                          "it": "Trasferimento ai Comuni di una percentuale della perequazione geotopografica",
                          "en": "Forwarding of a share in geographical/topographic equalization to municipalities"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "36224",
                        "labels": {
                          "de": "Weitergabe eines Anteils am Härteausgleich an Gemeinden",
                          "fr": "Transmission d'une part de la compensation des cas de rigueur aux communes",
                          "it": "Trasferimento ai Comuni di una percentuale della compensazione dei casi di rigore",
                          "en": "Forwarding of a share in cohesion fund to municipalities"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "36225",
                        "labels": {
                          "de": "Innerkantonaler vertikaler Finanzausgleich",
                          "fr": "Péréquation financière intracantonale verticale",
                          "it": "Perequazione finanziaria intracantonale verticale",
                          "en": "Intra-cantonal vertical fiscal equalization"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "36226",
                        "labels": {
                          "de": "Innerkantonaler vertikaler Lastenausgleich",
                          "fr": "Compensation des charges intracantonale verticale",
                          "it": "Compensazione degli oneri intracantonale verticale",
                          "en": "Intra-cantonal vertical cost compensation"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "36227",
                        "labels": {
                          "de": "Horizontaler Finanzausgleich von Gemeinde an Gemeinde",
                          "fr": "Péréquation financière horizontale : transferts entre communes",
                          "it": "Perequazione finanziaria horizontale da Comune a Comune",
                          "en": "Horizontal fiscal equalization between municipalities"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "36228",
                        "labels": {
                          "de": "Horizontaler Lastenausgleich von Gemeinde an Gemeinde",
                          "fr": "Compensation horizontale des charges : transferts entre communes",
                          "it": "Compensazione horizontale degli oneri da Comune a Comune",
                          "en": "Horizontal cost compensation between municipalities"
                        },
                        "values": {},
                        "children": []
                      }
                    ]
                  },
                  {
                    "code": "3624",
                    "labels": {
                      "de": "Finanz- und Lastenausgleich an öffentliche Unternehmen",
                      "fr": "Péréquation financière et compensation des charges aux entreprises publiques",
                      "it": "Perequazione finanziaria e compensazione degli oneri a imprese pubbliche",
                      "en": "Fiscal equalization and cost compensation for public corporations"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "3629",
                    "labels": {
                      "de": "Finanzausgleich n.a.g.",
                      "fr": "Péréquation financière n.c.a.",
                      "it": "Perequazione finanziaria n.m.a.",
                      "en": "Fiscal equalization n.e.c."
                    },
                    "values": {},
                    "children": []
                  }
                ]
              },
              {
                "code": "363",
                "labels": {
                  "de": "Beiträge an Gemeinwesen und Dritte",
                  "fr": "Contributions aux collectivités publiques et tiers",
                  "it": "Contributi a enti pubblici e a terzi",
                  "en": "Contributions to public authorities and third parties"
                },
                "values": {},
                "children": [
                  {
                    "code": "3630",
                    "labels": {
                      "de": "Beiträge an den Bund",
                      "fr": "Contributions à la Confédération",
                      "it": "Contributi alla Confederazione",
                      "en": "Contributions to the Confederation"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "3631",
                    "labels": {
                      "de": "Beiträge an Kantone und Konkordate",
                      "fr": "Contributions aux cantons et concordats",
                      "it": "Contributi a Cantoni e Concordati",
                      "en": "Contributions to cantons and concordats"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "3632",
                    "labels": {
                      "de": "Beiträge an Gemeinden und Gemeindezweckverbände",
                      "fr": "Contributions aux communes et syndicats intercommunaux",
                      "it": "Contributi a Comuni e consorzi comunali",
                      "en": "Contributions to municipalities and special purpose entities"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "3633",
                    "labels": {
                      "de": "Beiträge an öffentliche Sozialversicherungen",
                      "fr": "Contributions aux assurances sociales publiques",
                      "it": "Contributi ad assicurazioni sociali pubbliche",
                      "en": "Contributions to social security funds"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "3634",
                    "labels": {
                      "de": "Beiträge an öffentliche Unternehmen",
                      "fr": "Contributions aux entreprises publiques",
                      "it": "Contributi a imprese pubbliche",
                      "en": "Contributions to public corporations"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "3635",
                    "labels": {
                      "de": "Beiträge an private Unternehmen",
                      "fr": "Contributions aux entreprises privées",
                      "it": "Contributi a imprese private",
                      "en": "Contributions to private corporations"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "3636",
                    "labels": {
                      "de": "Beiträge an private Organisationen ohne Erwerbszweck",
                      "fr": "Contributions aux organisations privées à but non lucratif",
                      "it": "Contributi a organizzazioni private senza scopo di lucro",
                      "en": "Contributions to private non-profit organizations"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "3637",
                    "labels": {
                      "de": "Beiträge an private Haushalte",
                      "fr": "Contributions aux ménages privés",
                      "it": "Contributi a economie domestiche private",
                      "en": "Contributions to households"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "3638",
                    "labels": {
                      "de": "Beiträge an das Ausland",
                      "fr": "Contributions à l'étranger",
                      "it": "Contributi all’estero",
                      "en": "Contributions abroad"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "3639",
                    "labels": {
                      "de": "Stipendien",
                      "fr": "Bourses",
                      "it": "Borse di studio",
                      "en": "Scholarships"
                    },
                    "values": {},
                    "children": []
                  }
                ]
              },
              {
                "code": "364",
                "labels": {
                  "de": "Wertberichtigungen Darlehen, VV",
                  "fr": "Réévaluation de prêts, PA",
                  "it": "Rettificazioni di valore su mutui, beni amministrativi",
                  "en": "Value adjustments on loans, AA"
                },
                "values": {},
                "children": []
              },
              {
                "code": "365",
                "labels": {
                  "de": "Wertberichtigungen Beteiligungen, VV",
                  "fr": "Réévaluation de participations, PA",
                  "it": "Rettificazioni di valore su partecipazioni, beni amministrativi",
                  "en": "Value adjustments on financial interests, AA"
                },
                "values": {},
                "children": []
              },
              {
                "code": "366",
                "labels": {
                  "de": "Abschreibungen auf Investitionsbeiträge",
                  "fr": "Amortissement de contributions à des investissements",
                  "it": "Ammortamenti su contributi agli investimenti",
                  "en": "Depreciation of investment contributions"
                },
                "values": {},
                "children": []
              },
              {
                "code": "369",
                "labels": {
                  "de": "Übriger Transferaufwand",
                  "fr": "Autres charges de transfert",
                  "it": "Rimanenti spese inconto capitale",
                  "en": "Other transfer expenses"
                },
                "values": {},
                "children": []
              }
            ]
          },
          {
            "code": "38",
            "labels": {
              "de": "Ausserordentlicher Aufwand",
              "fr": "Charges extraordinaires",
              "it": "Spese straordinarie",
              "en": "Extraordinary expenses"
            },
            "values": {},
            "children": [
              {
                "code": "380",
                "labels": {
                  "de": "Ausserordentlicher Personalaufwand",
                  "fr": "Charges de personnel extraordinaires",
                  "it": "Spese straordinarie per il personale",
                  "en": "Extraordinary personnel expenses"
                },
                "values": {},
                "children": []
              },
              {
                "code": "381",
                "labels": {
                  "de": "Ausserordentlicher Sach- und Betriebsaufwand",
                  "fr": "Charges de biens et services et charges d'exploitation extraordinaires",
                  "it": "Spese straordinarie per beni e servizi e d’esercizio",
                  "en": "Extraordinary general, administrative and operating expenses"
                },
                "values": {},
                "children": []
              },
              {
                "code": "383",
                "labels": {
                  "de": "Zusätzliche Abschreibungen",
                  "fr": "Amortissements supplémentaires",
                  "it": "Ammortamenti supplementari",
                  "en": "Additional depreciation"
                },
                "values": {},
                "children": []
              },
              {
                "code": "384",
                "labels": {
                  "de": "Ausserordentlicher Finanzaufwand",
                  "fr": "Charges financières extraordinaires",
                  "it": "Spese finanziarie straordinarie",
                  "en": "Extraordinary financial expense"
                },
                "values": {},
                "children": []
              },
              {
                "code": "386",
                "labels": {
                  "de": "Ausserordentlicher Transferaufwand",
                  "fr": "Charges de transfert extraordinaires",
                  "it": "Spese di riversamento straordinarie",
                  "en": "Extraordinary transfer expenses"
                },
                "values": {},
                "children": [
                  {
                    "code": "3860",
                    "labels": {
                      "de": "Ausserordentlicher Transferaufwand; Bund",
                      "fr": "Charges de transfert extraordinaires; Confédération",
                      "it": "Spese di riversamento straordinarie; Confederazione",
                      "en": "Extraordinary transfer expenses; Confederation"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "3861",
                    "labels": {
                      "de": "Ausserordentlicher Transferaufwand; Kantone und Konkordate",
                      "fr": "Charges de transfert extraordinaires; cantons et concordats",
                      "it": "Spese di riversamento straordinarie; Cantoni e Concordati",
                      "en": "Extraordinary transfer expenses; cantons and concordats"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "3862",
                    "labels": {
                      "de": "Ausserordentlicher Transferaufwand; Gemeinden und Gemeindezweckverbände",
                      "fr": "Charges de transfert extraordinaires; communes et syndicats intercommunaux",
                      "it": "Spese di riversamento straordinarie; Comuni e consorzi comunali",
                      "en": "Extraordinary transfer expenses; municipalities and special purpose entities"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "3863",
                    "labels": {
                      "de": "Ausserordentlicher Transferaufwand; öffentliche Sozialversicherungen",
                      "fr": "Charges de transfert extraordinaires; assurances sociales publiques",
                      "it": "Spese di riversamento straordinarie; assicurazioni sociali pubbliche",
                      "en": "Extraordinary transfer expenses; social security funds"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "3864",
                    "labels": {
                      "de": "Ausserordentlicher Transferaufwand; öffentliche Unternehmen",
                      "fr": "Charges de transfert extraordinaires; entreprises publiques",
                      "it": "Spese di riversamento straordinarie; imprese pubbliche",
                      "en": "Extraordinary transfer expenses; public corporations"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "3865",
                    "labels": {
                      "de": "Ausserordentlicher Transferaufwand; private Unternehmen",
                      "fr": "Charges de transfert extraordinaires; entreprises privées",
                      "it": "Spese di riversamento straordinarie; imprese private",
                      "en": "Extraordinary transfer expenses; private corporations"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "3866",
                    "labels": {
                      "de": "Ausserordentlicher Transferaufwand; private Organisationen ohne Erwerbszweck",
                      "fr": "Charges de transfert extraordinaires; organisations privées à but non lucratif",
                      "it": "Spese di riversamentoe straordinarie; organizzazioni private senza scopo di lucro",
                      "en": "Extraordinary transfer expenses; private non-profit organizations"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "3867",
                    "labels": {
                      "de": "Ausserordentlicher Transferaufwand; private Haushalte",
                      "fr": "Charges de transfert extraordinaires; ménages privés",
                      "it": "Spese di riversamento straordinarie; economie domestiche private",
                      "en": "Extraordinary transfer expenses; households"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "3868",
                    "labels": {
                      "de": "Ausserordentlicher Transferaufwand; Ausland",
                      "fr": "Charges de transfert extraordinaires; étranger",
                      "it": "Spese di riversamento straordinarie; estero",
                      "en": "Extraordinary transfer expenses; abroad"
                    },
                    "values": {},
                    "children": []
                  }
                ]
              },
              {
                "code": "387",
                "labels": {
                  "de": "Zusätzliche Abschreibungen auf Darlehen, Beteiligungen und Investitionsbeiträgen",
                  "fr": "Amortissement supplémentaire des prêts, participations et contribution à des investissements",
                  "it": "Ammortamenti supplementari su mutui, partecipazioni e contributi agli investimenti",
                  "en": "Additional depreciation on loans, financial interests, and investment contributions"
                },
                "values": {},
                "children": []
              },
              {
                "code": "389",
                "labels": {
                  "de": "Einlagen in das Eigenkapital",
                  "fr": "Attributions au capital propre",
                  "it": "Versamenti al capitale proprio",
                  "en": "Net expenditure for net assets/equity"
                },
                "values": {},
                "children": []
              }
            ]
          }
        ]
      },
      {
        "code": "4",
        "labels": {
          "de": "Ertrag",
          "fr": "Revenus",
          "it": "Ricavi",
          "en": "Revenue"
        },
        "values": {},
        "children": [
          {
            "code": "40",
            "labels": {
              "de": "Fiskalertrag",
              "fr": "Revenus fiscaux",
              "it": "Introiti fiscali",
              "en": "Tax revenue"
            },
            "values": {},
            "children": [
              {
                "code": "400",
                "labels": {
                  "de": "Direkte Steuern natürliche Personen",
                  "fr": "Impôts directs, personnes physiques",
                  "it": "Imposte dirette di persone fisiche",
                  "en": "Direct taxes, natural persons"
                },
                "values": {},
                "children": [
                  {
                    "code": "4000",
                    "labels": {
                      "de": "Einkommenssteuern natürliche Personen",
                      "fr": "Impôts sur le revenu, personnes physiques",
                      "it": "Imposte sul reddito di persone fisiche",
                      "en": "Income tax, natural persons"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4001",
                    "labels": {
                      "de": "Vermögenssteuern natürliche Personen",
                      "fr": "Impôts sur la fortune, personnes physiques",
                      "it": "Imposte sulla sostanza di persone fisiche",
                      "en": "Wealth tax, natural persons"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4002",
                    "labels": {
                      "de": "Quellensteuern natürliche Personen",
                      "fr": "Impôts à la source, personnes physiques",
                      "it": "Imposte alla fonte di persone fisiche",
                      "en": "Withholding taxes, natural persons"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4008",
                    "labels": {
                      "de": "Personensteuern",
                      "fr": "Impôts sur les personnes",
                      "it": "Imposte personali",
                      "en": "Personal taxes"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4009",
                    "labels": {
                      "de": "Übrige direkte Steuern natürliche Personen",
                      "fr": "Autres impôts directs, personnes physiques",
                      "it": "Rimanenti imposte dirette di persone fisiche",
                      "en": "Other direct taxes, natural persons"
                    },
                    "values": {},
                    "children": []
                  }
                ]
              },
              {
                "code": "401",
                "labels": {
                  "de": "Direkte Steuern juristische Personen",
                  "fr": "Impôts directs, personnes morales",
                  "it": "Imposte dirette di persone giuridiche",
                  "en": "Direct taxes, legal entities"
                },
                "values": {},
                "children": [
                  {
                    "code": "4010",
                    "labels": {
                      "de": "Gewinnsteuern juristische Personen",
                      "fr": "Impôts sur le bénéfice, personnes morales",
                      "it": "Imposte sull'utile di persone giuridiche",
                      "en": "Profit taxes, legal entities"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4011",
                    "labels": {
                      "de": "Kapitalsteuern juristische Personen",
                      "fr": "Impôts sur le capital, personnes morales",
                      "it": "Imposte sul capitale di persone giuridiche",
                      "en": "Taxes on capital, legal entities"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4012",
                    "labels": {
                      "de": "Quellensteuern juristische Personen",
                      "fr": "Impôts à la source, personnes morales",
                      "it": "Imposte alla fonte di persone giuridiche",
                      "en": "Withholding taxes, legal entities"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4019",
                    "labels": {
                      "de": "Übrige direkte Steuern juristische Personen",
                      "fr": "Autres impôts directs, personnes morales",
                      "it": "Rimanenti imposte dirette di persone giuridiche",
                      "en": "Other direct taxes, legal entities"
                    },
                    "values": {},
                    "children": []
                  }
                ]
              },
              {
                "code": "402",
                "labels": {
                  "de": "Übrige direkte Steuern",
                  "fr": "Autres impôts directs",
                  "it": "Rimanenti imposte dirette",
                  "en": "Other direct taxes"
                },
                "values": {},
                "children": [
                  {
                    "code": "4020",
                    "labels": {
                      "de": "Verrechnungssteuer (nur Bund)",
                      "fr": "Impôt anticipé (uniquement Confédération)",
                      "it": "Imposta preventiva (solo Confederazione)",
                      "en": "Withholding tax (Confederation only)"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4021",
                    "labels": {
                      "de": "Grundsteuern",
                      "fr": "Impôts fonciers",
                      "it": "Imposte fondiarie",
                      "en": "Property tax"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4022",
                    "labels": {
                      "de": "Vermögensgewinnsteuern",
                      "fr": "Impôts sur les gains en capital",
                      "it": "Imposte sugli utili patrimoniali",
                      "en": "Capital gains tax"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4023",
                    "labels": {
                      "de": "Vermögensverkehrssteuern",
                      "fr": "Droits de mutation et timbre",
                      "it": "Imposte sulle transazioni patrimoniali",
                      "en": "Capital transfer tax"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4024",
                    "labels": {
                      "de": "Erbschafts- und Schenkungssteuern",
                      "fr": "Impôts sur les successions et donations",
                      "it": "Imposte sulle successioni e sulle donazioni",
                      "en": "Inheritance and gift tax"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4025",
                    "labels": {
                      "de": "Spielbanken- und Spielautomatenabgabe",
                      "fr": "Impôts sur les maisons de jeu et machines à sous",
                      "it": "Tassa sulle case da gioco e sugli apparecchi automatici da gioco",
                      "en": "Casino and slot machine tax"
                    },
                    "values": {},
                    "children": []
                  }
                ]
              },
              {
                "code": "403",
                "labels": {
                  "de": "Besitz- und Aufwandsteuern",
                  "fr": "Impôts sur la possession et la dépense",
                  "it": "Imposte sul possesso e sulla spesa",
                  "en": "Property and expenditure taxes"
                },
                "values": {},
                "children": [
                  {
                    "code": "4030",
                    "labels": {
                      "de": "Motorfahrzeugsteuern",
                      "fr": "Impôts sur les véhicules à moteur",
                      "it": "Tasse sul traffico",
                      "en": "Motor vehicle taxes"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4031",
                    "labels": {
                      "de": "Schiffssteuer",
                      "fr": "Impôt sur les bateaux",
                      "it": "Imposta sui natanti",
                      "en": "Boat tax"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4032",
                    "labels": {
                      "de": "Vergnügungssteuern",
                      "fr": "Impôts sur les divertissements",
                      "it": "Imposte sugli spettacoli",
                      "en": "Entertainment tax"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4033",
                    "labels": {
                      "de": "Hundesteuer",
                      "fr": "Impôt sur les chiens",
                      "it": "Imposta sui cani",
                      "en": "Dog license"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4039",
                    "labels": {
                      "de": "Übrige Besitz- und Aufwandsteuer",
                      "fr": "Autres impôts sur la possession et la dépense",
                      "it": "Rimanenti imposte sul possesso e sulla spesa",
                      "en": "Other property and expenditure taxes"
                    },
                    "values": {},
                    "children": []
                  }
                ]
              },
              {
                "code": "404",
                "labels": {
                  "de": "Verbrauchssteuern (nur Bund)",
                  "fr": "Impôts à la consommation (uniquement Confédération)",
                  "it": "Imposte sul consumo (solo Confederazione)",
                  "en": "Consumption taxes (Confederation only)"
                },
                "values": {},
                "children": [
                  {
                    "code": "4040",
                    "labels": {
                      "de": "Mehrwertsteuer",
                      "fr": "Taxe sur la valeur ajoutée",
                      "it": "Imposta sul valore aggiunto",
                      "en": "Value added tax"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4041",
                    "labels": {
                      "de": "Stempelabgabe",
                      "fr": "Droit de timbre",
                      "it": "Tassa di bollo",
                      "en": "Stamp duty"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4042",
                    "labels": {
                      "de": "Mineralölsteuer auf Treibstoffen",
                      "fr": "Impôt sur les huiles minérales grevant les carburants",
                      "it": "Imposta sugli oli minerali gravante i carburanti",
                      "en": "Mineral oil tax on fuel"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4043",
                    "labels": {
                      "de": "Mineralölsteuerzuschlag auf Treibstoffen",
                      "fr": "Surtaxe sur les huiles minérales grevant les carburants",
                      "it": "Supplemento fiscale sugli oli minerali gravante i carburanti",
                      "en": "Mineral oil surtax on motor fuel"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4044",
                    "labels": {
                      "de": "Mineralölsteuer auf Brennstoffen und and. Mineralölprodukten",
                      "fr": "Impôt sur les huiles minérales grevant les combustibles et les autres produits pétroliers",
                      "it": "Imposta sugli oli minerali riscossa sui combustibili e altri prodotti derivati dagli oli minerali",
                      "en": "Mineral oil tax on combustibles and other mineral oil products"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4045",
                    "labels": {
                      "de": "Tabaksteuer",
                      "fr": "Impôt sur le tabac",
                      "it": "Imposta sul tabacco",
                      "en": "Tobacco duty"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4046",
                    "labels": {
                      "de": "Biersteuer",
                      "fr": "Impôt sur la bière",
                      "it": "Imposta sulla birra",
                      "en": "Beer tax"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4047",
                    "labels": {
                      "de": "Besteuerung gebrannter Wasser (EAV)",
                      "fr": "Imposition des boissons distillées (RFA)",
                      "it": "Imposizione dei bevande distillate (RFA)",
                      "en": "Taxation of distilled spirits (SAB)"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4049",
                    "labels": {
                      "de": "Verbrauchssteuern n.a.g.",
                      "fr": "Impôts à la consommation n.c.a.",
                      "it": "Imposte sul consumo n.m.a.",
                      "en": "Consumption taxes n.e.c."
                    },
                    "values": {},
                    "children": []
                  }
                ]
              },
              {
                "code": "405",
                "labels": {
                  "de": "Verkehrsabgaben",
                  "fr": "Redevances sur la circulation",
                  "it": "Tasse sul traffico",
                  "en": "Transportation taxes"
                },
                "values": {},
                "children": [
                  {
                    "code": "4050",
                    "labels": {
                      "de": "Automobilsteuer",
                      "fr": "Impôt sur les véhicules automobiles",
                      "it": "Imposta sugli autoveicoli",
                      "en": "Automobile duty"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4051",
                    "labels": {
                      "de": "Nationalstrassenabgabe",
                      "fr": "Redevance pour l'utilisation des routes nationales",
                      "it": "Tassa per l'utilizzazione delle strade nazionali",
                      "en": "Motorway tax"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4052",
                    "labels": {
                      "de": "Schwerverkehrsabgabe",
                      "fr": "Redevance sur le trafic des poids lourds",
                      "it": "Tassa sul traffico pesante",
                      "en": "Heavy vehicle charge"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4053",
                    "labels": {
                      "de": "Abgaben kombinierter Verkehr",
                      "fr": "Redevances sur le trafic combiné",
                      "it": "Tasse sul traffico combinato",
                      "en": "Combined traffic taxes"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4059",
                    "labels": {
                      "de": "Verkehrsabgaben n.a.g.",
                      "fr": "Redevances sur la circulation n.c.a.",
                      "it": "Tasse sul traffico n.m.a.",
                      "en": "Transportation taxes n.e.c."
                    },
                    "values": {},
                    "children": []
                  }
                ]
              },
              {
                "code": "406",
                "labels": {
                  "de": "Zölle (nur Bund)",
                  "fr": "Droits de douane (uniquement Confédération)",
                  "it": "Dazi (solo Confederazione)",
                  "en": "Customs duties (Confederation only)"
                },
                "values": {},
                "children": [
                  {
                    "code": "4060",
                    "labels": {
                      "de": "Einfuhrzölle",
                      "fr": "Droits de douane à l'importation",
                      "it": "Dazi d'importazione",
                      "en": "Import duties"
                    },
                    "values": {},
                    "children": []
                  }
                ]
              },
              {
                "code": "407",
                "labels": {
                  "de": "Übrige Abgaben",
                  "fr": "Autres taxes",
                  "it": "Rimanenti tasse",
                  "en": "Other duties"
                },
                "values": {},
                "children": [
                  {
                    "code": "4070",
                    "labels": {
                      "de": "Lenkungsabgaben Umweltschutz",
                      "fr": "Taxes d'incitation, protection de l'environnement",
                      "it": "Tasse d'incentivazione per la protezione dell'ambiente",
                      "en": "Environmental incentive fees"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4071",
                    "labels": {
                      "de": "Landwirtschaftliche Abgaben",
                      "fr": "Taxes agricoles",
                      "it": "Tasse agricole",
                      "en": "Agricultural duties"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4072",
                    "labels": {
                      "de": "Sozialversicherungsbeiträge der Versicherten und Arbeitgeber",
                      "fr": "Cotisations des assurés et des employeurs aux assurances sociales",
                      "it": "Contributi degli assicurati e del datore di lavoro alle assicurazioni sociali",
                      "en": "Social security contributions by employers and insured persons"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4079",
                    "labels": {
                      "de": "Sonstiger Fiskalertrag",
                      "fr": "Revenus fiscaux distincts",
                      "it": "Altri introiti fiscali",
                      "en": "Other tax revenue"
                    },
                    "values": {},
                    "children": []
                  }
                ]
              }
            ]
          },
          {
            "code": "41",
            "labels": {
              "de": "Regalien und Konzessionen",
              "fr": "Patentes et concessions",
              "it": "Regalie e concessioni",
              "en": "Royalties and concessions"
            },
            "values": {},
            "children": [
              {
                "code": "410",
                "labels": {
                  "de": "Regalien",
                  "fr": "Patentes",
                  "it": "Regalie",
                  "en": "Royalties"
                },
                "values": {},
                "children": []
              },
              {
                "code": "411",
                "labels": {
                  "de": "Schweiz. Nationalbank",
                  "fr": "Banque nationale suisse",
                  "it": "Banca nazionale svizzera",
                  "en": "Swiss National Bank"
                },
                "values": {},
                "children": []
              },
              {
                "code": "412",
                "labels": {
                  "de": "Konzessionen",
                  "fr": "Concessions",
                  "it": "Concessioni",
                  "en": "Concessions"
                },
                "values": {},
                "children": []
              },
              {
                "code": "413",
                "labels": {
                  "de": "Ertragsanteile an Lotterien, Sport-Toto, Wetten",
                  "fr": "Parts de revenus de loteries, Sport-Toto, paris",
                  "it": "Quote del prodotto di lotterie, Sport-Toto, scommesse",
                  "en": "Revenue shares in lotteries, Sport-Toto, gambling"
                },
                "values": {},
                "children": []
              }
            ]
          },
          {
            "code": "42",
            "labels": {
              "de": "Entgelte",
              "fr": "Compensations",
              "it": "Ricavi e tasse",
              "en": "Revenue from exchange transactions"
            },
            "values": {},
            "children": [
              {
                "code": "420",
                "labels": {
                  "de": "Ersatzabgaben",
                  "fr": "Taxes de compensation",
                  "it": "Tasse di compensazione",
                  "en": "Exemption taxes"
                },
                "values": {},
                "children": []
              },
              {
                "code": "421",
                "labels": {
                  "de": "Gebühren für Amtshandlungen",
                  "fr": "Emoluments pour actes administratifs",
                  "it": "Emolumenti per atti ufficiali",
                  "en": "Fees for administrative acts"
                },
                "values": {},
                "children": []
              },
              {
                "code": "422",
                "labels": {
                  "de": "Spital- und Heimtaxen, Kostgelder",
                  "fr": "Taxes pour hôpitaux et établissements médicaux sociaux, subventions aux frais de pension",
                  "it": "Tasse di ospedali e ospizi, rette",
                  "en": "Hospital and care home taxes, meal subsidies"
                },
                "values": {},
                "children": []
              },
              {
                "code": "423",
                "labels": {
                  "de": "Schul- und Kursgelder",
                  "fr": "Frais d'écolage et taxes de cours",
                  "it": "Tasse scolastiche e per corsi",
                  "en": "School and course fees"
                },
                "values": {},
                "children": []
              },
              {
                "code": "424",
                "labels": {
                  "de": "Benützungsgebühren und Dienstleistungen",
                  "fr": "Emoluments d'utilisation et prestations de service",
                  "it": "Tasse di utilizzazione e prestazioni di servizi",
                  "en": "User charges and services"
                },
                "values": {},
                "children": []
              },
              {
                "code": "425",
                "labels": {
                  "de": "Erlös aus Verkäufen",
                  "fr": "Recettes provenant de ventes",
                  "it": "Ricavi da vendite",
                  "en": "Proceeds from sales"
                },
                "values": {},
                "children": []
              },
              {
                "code": "426",
                "labels": {
                  "de": "Rückerstattungen",
                  "fr": "Remboursements",
                  "it": "Rimborsi",
                  "en": "Reimbursements"
                },
                "values": {},
                "children": []
              },
              {
                "code": "427",
                "labels": {
                  "de": "Bussen",
                  "fr": "Amendes",
                  "it": "Multe",
                  "en": "Fines"
                },
                "values": {},
                "children": []
              },
              {
                "code": "429",
                "labels": {
                  "de": "Übrige Entgelte",
                  "fr": "Autres compensations",
                  "it": "Diversi ricavi e tasse",
                  "en": "Other revenue from exchange transactions"
                },
                "values": {},
                "children": []
              }
            ]
          },
          {
            "code": "43",
            "labels": {
              "de": "Übrige Erträge",
              "fr": "Autres revenus",
              "it": "Rimanenti ricavi",
              "en": "Other revenue"
            },
            "values": {},
            "children": [
              {
                "code": "430",
                "labels": {
                  "de": "Übrige betriebliche Erträge",
                  "fr": "Autres revenus d'exploitation",
                  "it": "Rimanenti ricavi d'esercizio",
                  "en": "Other operating revenue"
                },
                "values": {},
                "children": []
              },
              {
                "code": "431",
                "labels": {
                  "de": "Aktivierung Eigenleistungen",
                  "fr": "Inscription de prestations propres à l'actif",
                  "it": "Iscrizione all'attivo di prestazioni proprie",
                  "en": "Own work capitalized"
                },
                "values": {},
                "children": []
              },
              {
                "code": "432",
                "labels": {
                  "de": "Bestandesveränderungen",
                  "fr": "Variations de stocks",
                  "it": "Variazioni del saldo",
                  "en": "Changes in inventories"
                },
                "values": {},
                "children": []
              },
              {
                "code": "439",
                "labels": {
                  "de": "Übriger Ertrag",
                  "fr": "Autres revenus",
                  "it": "Rimanenti ricavi",
                  "en": "Other revenue"
                },
                "values": {},
                "children": []
              }
            ]
          },
          {
            "code": "44",
            "labels": {
              "de": "Finanzertrag",
              "fr": "Revenus financiers",
              "it": "Ricavi finanziari",
              "en": "Financial revenue"
            },
            "values": {},
            "children": [
              {
                "code": "440",
                "labels": {
                  "de": "Zinsertrag",
                  "fr": "Revenus des intérêts",
                  "it": "Ricavi a titolo di interessi",
                  "en": "Interest income"
                },
                "values": {},
                "children": []
              },
              {
                "code": "441",
                "labels": {
                  "de": "Realisierte Gewinne, FV",
                  "fr": "Gains réalisés, PF",
                  "it": "Utili realizzati, beni patrimoniali",
                  "en": "Realized gains, NAA"
                },
                "values": {},
                "children": []
              },
              {
                "code": "442",
                "labels": {
                  "de": "Beteiligungsertrag, FV",
                  "fr": "Revenus de participations, PF",
                  "it": "Proventi da partecipazioni, beni patrimoniali",
                  "en": "Revenue from financial interests, NAA"
                },
                "values": {},
                "children": []
              },
              {
                "code": "443",
                "labels": {
                  "de": "Liegenschaftenertrag, FV",
                  "fr": "Revenus des immeubles, PF",
                  "it": "Redditi immobiliari, beni patrimoniali",
                  "en": "Building revenue, NAA"
                },
                "values": {},
                "children": []
              },
              {
                "code": "444",
                "labels": {
                  "de": "Wertberichtigungen Anlagen, FV",
                  "fr": "Réévaluation des immobilisations, PF",
                  "it": "Rettificazioni di valore su investimenti, beni patrimoniali",
                  "en": "Value adjustments on investments, NAA"
                },
                "values": {},
                "children": []
              },
              {
                "code": "445",
                "labels": {
                  "de": "Finanzertrag aus Darlehen und Beteiligungen, VV",
                  "fr": "Revenus financiers de prêts et de participations du PA",
                  "it": "Ricavi finanziari da mutui e partecipazioni, beni amministrativi",
                  "en": "Financial revenue from loans and financial interests, AA"
                },
                "values": {},
                "children": []
              },
              {
                "code": "446",
                "labels": {
                  "de": "Finanzertrag von öffentlichen Unternehmen",
                  "fr": "Revenus financiers d'entreprises publiques",
                  "it": "Ricavi finanziari di imprese pubbliche",
                  "en": "Financial revenue of public corporations"
                },
                "values": {},
                "children": []
              },
              {
                "code": "447",
                "labels": {
                  "de": "Liegenschaftenertrag, VV",
                  "fr": "Revenus des immeubles, PA",
                  "it": "Redditi immobiliari, beni amministrativi",
                  "en": "Building revenue, AA"
                },
                "values": {},
                "children": []
              },
              {
                "code": "448",
                "labels": {
                  "de": "Erträge von gemieteten Liegenschaften, VV",
                  "fr": "Revenus des immeubles loués, PA",
                  "it": "Ricavi da immobili in locazione, beni amministrativi",
                  "en": "Revenue from rented buildings, AA"
                },
                "values": {},
                "children": []
              },
              {
                "code": "449",
                "labels": {
                  "de": "Übriger Finanzertrag",
                  "fr": "Autres revenus financiers",
                  "it": "Rimanenti ricavi finanziari",
                  "en": "Other financial revenue"
                },
                "values": {},
                "children": []
              }
            ]
          },
          {
            "code": "45",
            "labels": {
              "de": "Entnahmen aus Fonds und Spezialfinanzierungen",
              "fr": "Prélèvements sur les fonds et les financements spéciaux",
              "it": "Prelievi da fondi e finanziamenti speciali",
              "en": "Withdrawals from funds and special financing"
            },
            "values": {},
            "children": [
              {
                "code": "450",
                "labels": {
                  "de": "Entnahmen aus Fonds und Spezialfinanzierungen im Fremdkapital",
                  "fr": "Prélèvements sur les fonds et les financements spéciaux enregistrés sous capitaux de tiers",
                  "it": "Prelievi da fondi e finanziamenti speciali nel capitale di terzi",
                  "en": "Withdrawals from funds and special financing in liabilities"
                },
                "values": {},
                "children": []
              },
              {
                "code": "451",
                "labels": {
                  "de": "Entnahmen aus Fonds und Spezialfinanzierungen im Eigenkapital",
                  "fr": "Prélèvements sur les fonds et les financements spéciaux enregistrés sous capital propre",
                  "it": "Prelievi da fondi e finanziamenti speciali nel capitale proprio",
                  "en": "Withdrawals from funds and special financing in net assets/equity"
                },
                "values": {},
                "children": []
              },
              {
                "code": "452",
                "labels": {
                  "de": "Entnahmen aus Fonds und Spezialfinanzierungen n.a.g.",
                  "fr": "Prélèvements sur les fonds et les financements spéciaux n.c.a.",
                  "it": "Prelievi da fondi e finanziamenti speciali n.m.a.",
                  "en": "Withdrawals from funds and special financing n.e.c."
                },
                "values": {},
                "children": []
              }
            ]
          },
          {
            "code": "46",
            "labels": {
              "de": "Transferertrag",
              "fr": "Revenus de transfert",
              "it": "Ricavi da riversamenti",
              "en": "Transfer revenue"
            },
            "values": {},
            "children": [
              {
                "code": "460",
                "labels": {
                  "de": "Ertragsanteile",
                  "fr": "Parts de revenus",
                  "it": "Partecipazioni a ricavi",
                  "en": "Revenue shares"
                },
                "values": {},
                "children": [
                  {
                    "code": "4600",
                    "labels": {
                      "de": "Anteil am Ertrag Bundeserträgen",
                      "fr": "Part des revenus de la Confédération",
                      "it": "Partecipazione ai ricavi della Confederazione",
                      "en": "Share in revenue, Confederation revenue"
                    },
                    "values": {},
                    "children": [
                      {
                        "code": "46000",
                        "labels": {
                          "de": "Anteil am Ertrag Direkter Bundessteuer",
                          "fr": "Part des revenus de l'impôt fédéral direct",
                          "it": "Partecipazione ai ricavi dell'imposta federale diretta",
                          "en": "Share in revenue of direct federal tax"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "46001",
                        "labels": {
                          "de": "Anteil am Ertrag Verrechnungssteuer",
                          "fr": "Part des revenus de l'impôt anticipé",
                          "it": "Partecipazione ai ricavi dell’imposta preventiva",
                          "en": "Share in revenue of withholding tax"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "46002",
                        "labels": {
                          "de": "Anteil am Ertrag Wehrpflichtersatz",
                          "fr": "Part des revenus de la taxe d'exemption de l'obligation de servir",
                          "it": "Partecipazione ai ricavi della tassa d’esenzione dall’obbligo militare",
                          "en": "Share in revenue of military service exemption tax"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "46003",
                        "labels": {
                          "de": "Anteil am Ertrag Eidg. Alkoholverwaltung",
                          "fr": "Part des revenus de la Régie fédérale des alcools",
                          "it": "Partecipazione ai ricavi della Regìa federale degli alcool",
                          "en": "Share in revenue of the Swiss Alcohol Board"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "46004",
                        "labels": {
                          "de": "Anteil am Ertrag Eidg. Bussen und Taxen",
                          "fr": "Part des revenus des amendes et taxes fédérales",
                          "it": "Partecipazione ai ricavi di tasse e multe della Confederazione",
                          "en": "Share in revenue from federal fines and duties"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "46005",
                        "labels": {
                          "de": "Anteil am Ertrag Eidg. Mineralölsteuer",
                          "fr": "Part des revenus de l'impôt fédéral sur les huiles minérales",
                          "it": "Partecipazione ai ricavi dell’imposta federale sugli oli minerali",
                          "en": "Share in federal mineral oil tax revenue"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "46006",
                        "labels": {
                          "de": "Anteil am Ertrag Eidg. Stempelsteuer",
                          "fr": "Part des revenus des droits de timbre fédéraux",
                          "it": "Partecipazione ai ricavi della tassa di bollo",
                          "en": "Share in federal stamp duty revenue"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "46007",
                        "labels": {
                          "de": "Anteil am Ertrag EU-Zinsbesteuerung",
                          "fr": "Part des revenus de la fiscalité de l'épargne UE",
                          "it": "Partecipazione ai ricavi della fiscalità del risparmio dell’UE",
                          "en": "Share in EU savings tax revenue"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "46008",
                        "labels": {
                          "de": "Anteil am Ertrag LSVA",
                          "fr": "Part des revenus de la RPLP",
                          "it": "Partecipazione ai ricavi della TTPCP",
                          "en": "Share in mileage-related heavy vehicle charge revenue"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "46009",
                        "labels": {
                          "de": "Anteil am Ertrag übriger Bundeseinnahmen",
                          "fr": "Part des autres revenus de la Confédération",
                          "it": "Partecipazione ai ricavi delle rimanenti entrate della Confederazione",
                          "en": "Share in revenue from other federal receipts"
                        },
                        "values": {},
                        "children": []
                      }
                    ]
                  },
                  {
                    "code": "4601",
                    "labels": {
                      "de": "Anteil an Kantonserträgen und Konkordaten",
                      "fr": "Part des revenus des cantons et concordats",
                      "it": "Partecipazioni ai ricavi di Cantoni e concordati",
                      "en": "Share in revenue of cantons and concordats"
                    },
                    "values": {},
                    "children": [
                      {
                        "code": "46010",
                        "labels": {
                          "de": "Anteil am Ertrag kantonaler Steuern",
                          "fr": "Part des revenus des impôts cantonaux",
                          "it": "Partecipazione ai ricavi delle imposte cantonali",
                          "en": "Share in cantonal tax revenue"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "46011",
                        "labels": {
                          "de": "Anteil am Ertrag kantonaler Regalien und Konzessionen",
                          "fr": "Part des revenus des patentes et concessions cantonales",
                          "it": "Partecipazione ai ricavi di regalie e concessioni cantonali",
                          "en": "Share in revenue from cantonal royalties and concessions"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "46012",
                        "labels": {
                          "de": "Anteil an kantonalen Gebühren",
                          "fr": "Part des émoluments cantonaux",
                          "it": "Partecipazione a tasse cantonali",
                          "en": "Share in cantonal fees"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "46019",
                        "labels": {
                          "de": "Anteil an übrigen kantonalen Erträgen",
                          "fr": "Part des autres revenus cantonaux",
                          "it": "Partecipazione ai rimanenti ricavi cantonali",
                          "en": "Share in other cantonal revenue"
                        },
                        "values": {},
                        "children": []
                      }
                    ]
                  },
                  {
                    "code": "4603",
                    "labels": {
                      "de": "Anteil an Erträgen öffentlicher Sozialversicherungsanstalten",
                      "fr": "Part des revenus des institutions publiques d'assurance sociale",
                      "it": "Partecipazioni a ricavi di istituti di assicurazioni sociali pubbliche",
                      "en": "Share in revenue of social security funds"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4604",
                    "labels": {
                      "de": "Anteile an Erträgen öffentlicher Unternehmen",
                      "fr": "Parts des revenus des entreprises publiques",
                      "it": "Partecipazioni a ricavi di imprese pubbliche",
                      "en": "Share in revenue of public corporations"
                    },
                    "values": {},
                    "children": []
                  }
                ]
              },
              {
                "code": "461",
                "labels": {
                  "de": "Entschädigungen",
                  "fr": "Indemnités",
                  "it": "Indennizzi",
                  "en": "Compensation"
                },
                "values": {},
                "children": [
                  {
                    "code": "4610",
                    "labels": {
                      "de": "Entschädigungen vom Bund",
                      "fr": "Indemnités de la Confédération",
                      "it": "Indennizzi della Confederazione",
                      "en": "Compensation from the Confederation"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4611",
                    "labels": {
                      "de": "Entschädigungen von Kantonen und Konkordaten",
                      "fr": "Indemnités des cantons et concordats",
                      "it": "Indennizzi di Cantoni e concordati",
                      "en": "Compensation from cantons and concordats"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4612",
                    "labels": {
                      "de": "Entschädigungen von Gemeinden und Gemeindezweckverbänden",
                      "fr": "Indemnités des communes et syndicats intercommunaux",
                      "it": "Indennizzi di Comuni e consorzi comunali",
                      "en": "Compensation from municipalities and special purpose entities"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4613",
                    "labels": {
                      "de": "Entschädigungen von öffentlichen Sozialversicherungen",
                      "fr": "Indemnités des assurances sociales publiques",
                      "it": "Indennizzi di assicurazioni sociali pubbliche",
                      "en": "Compensation from social security funds"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4614",
                    "labels": {
                      "de": "Entschädigungen von öffentlichen Unternehmen",
                      "fr": "Indemnités des entreprises publiques",
                      "it": "Indennizzi di imprese pubbliche",
                      "en": "Compensation from public corporations"
                    },
                    "values": {},
                    "children": []
                  }
                ]
              },
              {
                "code": "462",
                "labels": {
                  "de": "Finanz- und Lastenausgleich",
                  "fr": "Péréquation financière et compensation des charges",
                  "it": "Perequazione finanziaria e compensazione degli oneri",
                  "en": "Fiscal equalization and cost compensation"
                },
                "values": {},
                "children": [
                  {
                    "code": "4620",
                    "labels": {
                      "de": "Finanz- und Lastenausgleich Bund",
                      "fr": "Péréquation financière et compensation des charges de la Confédération",
                      "it": "Perequazione finanziaria e compensazione degli oneri, Confederazione",
                      "en": "Fiscal equalization and cost compensation, Confederation"
                    },
                    "values": {},
                    "children": [
                      {
                        "code": "46201",
                        "labels": {
                          "de": "Ressourcenausgleich",
                          "fr": "Péréquation des ressources",
                          "it": "Perequazione delle risorse",
                          "en": "Resource equalization"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "46202",
                        "labels": {
                          "de": "Sozio-demografischer Ausgleich",
                          "fr": "Compensation des charges excessives dues à des facteurs socio-démographiques",
                          "it": "Perequazione sociodemografica",
                          "en": "Socio-demographic equalization"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "46203",
                        "labels": {
                          "de": "Geografisch-topografischer Ausgleich",
                          "fr": "Compensation des charges excessives dues à des facteurs géo-topographiques",
                          "it": "Perequazione geotopografica",
                          "en": "Geographical/topographic equalization"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "46204",
                        "labels": {
                          "de": "Härteausgleich",
                          "fr": "Compensation des cas de rigueur",
                          "it": "Compensazione dei casi di rigore",
                          "en": "Cohesion fund"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "46209",
                        "labels": {
                          "de": "Übrige Massnahmen des Finanzausgleichs",
                          "fr": "Autres mesures liées à la péréquation financière",
                          "it": "Rimanenti misure della perequazione finanziaria",
                          "en": "Other measures of the fiscal equalization"
                        },
                        "values": {},
                        "children": []
                      }
                    ]
                  },
                  {
                    "code": "4621",
                    "labels": {
                      "de": "Finanz- und Lastenausgleich von Kantonen",
                      "fr": "Péréquation financière et compensation des charges des cantons",
                      "it": "Perequazione finanziaria e compensazione degli oneri di Cantoni",
                      "en": "Fiscal equalization and cost compensation from cantons"
                    },
                    "values": {},
                    "children": [
                      {
                        "code": "46211",
                        "labels": {
                          "de": "Ressourcenausgleich",
                          "fr": "Péréquation des ressources",
                          "it": "Perequazione delle risorse",
                          "en": "Resource equalization"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "46212",
                        "labels": {
                          "de": "Anteil am sozio-demografischen Lastenausgleich des Kantons",
                          "fr": "Part de la compensation des charges excessives dues à des facteurs socio-démographiques du canton",
                          "it": "Quota alla compensazione degli oneri eccessivi dovuti a fattori sociodemografici del Cantone",
                          "en": "Share in the socio-demographic equalization of the canton"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "46213",
                        "labels": {
                          "de": "Anteil am geografisch-topografischen Lastenausgleich des Kantons",
                          "fr": "Part de la compensation des charges excessives dues à des facteurs géo-topographiques du canton",
                          "it": "Quota alla compensazione degli oneri eccessivi dovuti a fattori geotopografici del Cantone",
                          "en": "Share in the geographical & topographic equalization of the canton"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "46214",
                        "labels": {
                          "de": "Härteausgleich",
                          "fr": "Compensation des cas de rigueur",
                          "it": "Compensazione dei casi di rigore",
                          "en": "Cohesion fund"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "46215",
                        "labels": {
                          "de": "Vertikaler Finanzausgleich von Kanton zu Gemeinden",
                          "fr": "Péréquation financière verticale du canton aux communes",
                          "it": "Perequazione finanziaria verticale da Cantone a Comuni",
                          "en": "Vertical fiscal equalization between canton and municipalities"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "46216",
                        "labels": {
                          "de": "Vertikaler Lastenausgleich von Kanton zu Gemeinden",
                          "fr": "Compensation verticale des charges du canton aux communes",
                          "it": "Compensazione verticale degli oneri da Cantone a Comuni",
                          "en": "Vertical cost compensation between canton and municipalities"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "46217",
                        "labels": {
                          "de": "Ressourcen- und Härteausgleich von Geberkantonen",
                          "fr": "Péréquation des ressources et compensation des cas de rigueur des cantons contributeurs",
                          "it": "Perequazione delle risorse e compensazione dei casi di rigore dei Cantoni donatori",
                          "en": "Resource equalization and cohesion fund from donor cantons"
                        },
                        "values": {},
                        "children": []
                      }
                    ]
                  },
                  {
                    "code": "4622",
                    "labels": {
                      "de": "Finanz- und Lastenausgleich von Gemeinden",
                      "fr": "Péréquation financière et compensation des charges des communes",
                      "it": "Perequazione finanziaria e compensazione degli oneri di Comuni",
                      "en": "Fiscal equalization and cost compensation from municipalities"
                    },
                    "values": {},
                    "children": [
                      {
                        "code": "46225",
                        "labels": {
                          "de": "Innerkantonaler vertikaler Finanzausgleich",
                          "fr": "Péréquation financière intracantonale verticale",
                          "it": "Perequazione finanziaria intracantonale verticale",
                          "en": "Intra-cantonal vertical fiscal equalization"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "46226",
                        "labels": {
                          "de": "Innerkantonaler vertikaler Lastenausgleich",
                          "fr": "Compensation des charges intracantonale verticale",
                          "it": "Compensazione degli oneri intracantonale verticale",
                          "en": "Intra-cantonal vertical cost compensation"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "46227",
                        "labels": {
                          "de": "Horizontaler Finanzausgleich von Gemeinde an Gemeinde",
                          "fr": "Péréquation financière horizontale : transferts entre communes",
                          "it": "Perequazione finanziaria horizontale da Comune a Comune",
                          "en": "Horizontal fiscal equalization between municipalities"
                        },
                        "values": {},
                        "children": []
                      },
                      {
                        "code": "46228",
                        "labels": {
                          "de": "Horizontaler Lastenausgleich von Gemeinde an Gemeinde",
                          "fr": "Compensation horizontale des charges : transferts entre communes",
                          "it": "Compensazione horizontale degli oneri da Comune a Comune",
                          "en": "Horizontal cost compensation between municipalities"
                        },
                        "values": {},
                        "children": []
                      }
                    ]
                  },
                  {
                    "code": "4624",
                    "labels": {
                      "de": "Finanz- und Lastenausgleich von öffentlichen Unternehmen",
                      "fr": "Péréquation financière et compensation des charges des entreprises publiques",
                      "it": "Perequazione finanziaria e compensazione degli oneri dalle imprese pubbliche",
                      "en": "Fiscal equalization and cost compensation from public corporations"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4629",
                    "labels": {
                      "de": "Finanzausgleich n.a.g.",
                      "fr": "Péréquation financière n.c.a.",
                      "it": "Perequazione finanziaria n.m.a.",
                      "en": "Fiscal equalization n.e.c."
                    },
                    "values": {},
                    "children": []
                  }
                ]
              },
              {
                "code": "463",
                "labels": {
                  "de": "Beiträge von Gemeinwesen und Dritten",
                  "fr": "Contributions de collectivités publiques et tiers",
                  "it": "Contributi di enti pubblici e terzi",
                  "en": "Contributions from public authorities and third parties"
                },
                "values": {},
                "children": [
                  {
                    "code": "4630",
                    "labels": {
                      "de": "Beiträge vom Bund",
                      "fr": "Contributions de la Confédération",
                      "it": "Contributi della Confederazione",
                      "en": "Contributions from the Confederation"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4631",
                    "labels": {
                      "de": "Beiträge von Kantonen und Konkordaten",
                      "fr": "Contributions des cantons et concordats",
                      "it": "Contributi di Cantoni e concordati",
                      "en": "Contributions from cantons and concordats"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4632",
                    "labels": {
                      "de": "Beiträge von Gemeinden und Gemeindezweckverbänden",
                      "fr": "Contributions des communes et syndicats intercommunaux",
                      "it": "Contributi di Comuni e consorzi comunali",
                      "en": "Contributions from municipalities and special purpose entities"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4633",
                    "labels": {
                      "de": "Beiträge von öffentlichen Sozialversicherungen",
                      "fr": "Contributions des assurances sociales publiques",
                      "it": "Contributi di assicurazioni sociali pubbliche",
                      "en": "Contributions from social security funds"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4634",
                    "labels": {
                      "de": "Beiträge von öffentlichen Unternehmen",
                      "fr": "Contributions des entreprises publiques",
                      "it": "Contributi di imprese pubbliche",
                      "en": "Contributions from public corporations"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4635",
                    "labels": {
                      "de": "Beiträge von privaten Unternehmen",
                      "fr": "Contributions des entreprises privées",
                      "it": "Contributi di imprese private",
                      "en": "Contributions from private corporations"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4636",
                    "labels": {
                      "de": "Beiträge von privaten Organisationen ohne Erwerbszweck",
                      "fr": "Contributions des organisations privées à but non lucratif",
                      "it": "Contributi di organizzazioni private senza scopo di lucro",
                      "en": "Contributions from private non-profit organizations"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4637",
                    "labels": {
                      "de": "Beiträge von privaten Haushalten",
                      "fr": "Contributions des ménages privés",
                      "it": "Contributi di economie domestiche private",
                      "en": "Contributions from households"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4638",
                    "labels": {
                      "de": "Beiträge aus dem Ausland",
                      "fr": "Contributions provenant de l'étranger",
                      "it": "Contributi dall’estero",
                      "en": "Contributions from abroad"
                    },
                    "values": {},
                    "children": []
                  }
                ]
              },
              {
                "code": "466",
                "labels": {
                  "de": "Auflösung passivierte Investitionsbeiträge",
                  "fr": "Dissolution de contributions à des investissements portées au passif",
                  "it": "Scioglimento di contributi agli investimenti iscritti al passivo",
                  "en": "Dissolution of investment contributions posted as liabilities"
                },
                "values": {},
                "children": []
              },
              {
                "code": "469",
                "labels": {
                  "de": "Übriger Transferertrag",
                  "fr": "Autres revenus de transfert",
                  "it": "Rimanenti ricavi da riversamenti",
                  "en": "Other transfer revenue"
                },
                "values": {},
                "children": []
              }
            ]
          },
          {
            "code": "48",
            "labels": {
              "de": "Ausserordentlicher Ertrag",
              "fr": "Revenus extraordinaires",
              "it": "Ricavi straordinari",
              "en": "Extraordinary revenue"
            },
            "values": {},
            "children": [
              {
                "code": "481",
                "labels": {
                  "de": "Ausserordentliche Erträge von Regalien, Konzessionen",
                  "fr": "Revenus extraordinaires de patentes, concessions",
                  "it": "Ricavi straordinari da regalie e concessioni",
                  "en": "Extraordinary revenue from royalties, concessions"
                },
                "values": {},
                "children": []
              },
              {
                "code": "482",
                "labels": {
                  "de": "Ausserordentliche Entgelte",
                  "fr": "Compensations extraordinaires",
                  "it": "Ricavi e tasse straordinari",
                  "en": "Extraordinary revenue from exchange transactions"
                },
                "values": {},
                "children": []
              },
              {
                "code": "483",
                "labels": {
                  "de": "Ausserordentliche verschiedene Erträge",
                  "fr": "Revenus divers extraordinaires",
                  "it": "Diversi ricavi straordinari",
                  "en": "Extraordinary miscellaneous revenue"
                },
                "values": {},
                "children": []
              },
              {
                "code": "484",
                "labels": {
                  "de": "Ausserordentliche Finanzerträge",
                  "fr": "Revenus financiers extraordinaires",
                  "it": "Ricavi finanziari straordinari",
                  "en": "Extraordinary financial revenue"
                },
                "values": {},
                "children": []
              },
              {
                "code": "485",
                "labels": {
                  "de": "",
                  "fr": "",
                  "it": "",
                  "en": ""
                },
                "values": {},
                "children": []
              },
              {
                "code": "486",
                "labels": {
                  "de": "Ausserordentliche Transfererträge",
                  "fr": "Revenus de transfert extraordinaires",
                  "it": "Ricavi straordinari da riversamenti",
                  "en": "Extraordinary transfer revenue"
                },
                "values": {},
                "children": [
                  {
                    "code": "4860",
                    "labels": {
                      "de": "Ausserordentliche Transfererträge, Bund",
                      "fr": "Revenus de transfert extraordinaires, Confédération",
                      "it": "Ricavi straordinari da riversamenti, Confederazione",
                      "en": "Extraordinary transfer revenue, Confederation"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4861",
                    "labels": {
                      "de": "Ausserordentliche Transfererträge, Kantone",
                      "fr": "Revenus de transfert extraordinaires, cantons",
                      "it": "Ricavi straordinari da riversamenti, Cantoni",
                      "en": "Extraordinary transfer revenue, cantons"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4862",
                    "labels": {
                      "de": "Ausserordentliche Transfererträge, Gemeinden",
                      "fr": "Revenus de transfert extraordinaires, communes",
                      "it": "Ricavi straordinari da riversamenti, Comuni",
                      "en": "Extraordinary transfer revenue, municipalities"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4863",
                    "labels": {
                      "de": "Ausserordentliche Transfererträge, öffentliche Sozialversicherungen",
                      "fr": "Revenus de transfert extraordinaires, assurances sociales publiques",
                      "it": "Ricavi straordinari da riversamenti, assicurazioni sociali pubbliche",
                      "en": "Extraordinary transfer revenue, social security funds"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4864",
                    "labels": {
                      "de": "Ausserordentliche Transfererträge, öffentliche Unternehmen",
                      "fr": "Revenus de transfert extraordinaires, entreprises publiques",
                      "it": "Ricavi straordinari da riversamenti, imprese pubbliche",
                      "en": "Extraordinary transfer revenue, public corporations"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4865",
                    "labels": {
                      "de": "Ausserordentliche Transfererträge, private Unternehmen",
                      "fr": "Revenus de transfert extraordinaires, entreprises privées",
                      "it": "Ricavi straordinari da riversamenti, imprese private",
                      "en": "Extraordinary transfer revenue, private corporations"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4866",
                    "labels": {
                      "de": "Ausserordentliche Transfererträge, private Organisationen ohne Erwerbszweck",
                      "fr": "Revenus de transfert extraordinaires, organisations privées à but non lucratif",
                      "it": "Ricavi straordinari da riversamenti, organizzazioni private senza scopo di lucro",
                      "en": "Extraordinary transfer revenue, private non-profit organizations"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4867",
                    "labels": {
                      "de": "Ausserordentliche Transfererträge, private Haushalte",
                      "fr": "Revenus de transfert extraordinaires, ménages privés",
                      "it": "Ricavi straordinari da riversamenti, economie domestiche private",
                      "en": "Extraordinary transfer revenue, households"
                    },
                    "values": {},
                    "children": []
                  },
                  {
                    "code": "4868",
                    "labels": {
                      "de": "Ausserordentliche Transfererträge, Ausland",
                      "fr": "Revenus de transfert extraordinaires, étranger",
                      "it": "Ricavi straordinari da riversamenti, estero",
                      "en": "Extraordinary transfer revenue, abroad"
                    },
                    "values": {},
                    "children": []
                  }
                ]
              },
              {
                "code": "487",
                "labels": {
                  "de": "Zusätzliche Auflösung passivierter Investitionsbeiträge",
                  "fr": "Dissolution supplémentaire des subventions d’investissement portées au passif",
                  "it": "Scioglimento supplementare di contributi agli investimenti iscritti al passivo",
                  "en": "Additional dissolution of investment contributions, capitalized or posted as liabilities"
                },
                "values": {},
                "children": [
                  {
                    "code": "4870",
                    "labels": {
                      "de": "Zusätzliche Auflösung passivierter Investitionsbeiträge",
                      "fr": "Dissolution supplémentaire des subventions d’investissement portées au passif",
                      "it": "Scioglimento supplementare di contributi agli investimenti iscritti al passivo",
                      "en": "Additional dissolution of investment contributions, capitalized or posted as liabilities"
                    },
                    "values": {},
                    "children": []
                  }
                ]
              },
              {
                "code": "489",
                "labels": {
                  "de": "Entnahmen aus dem Eigenkapital",
                  "fr": "Prélèvements sur le capital propre",
                  "it": "Prelievi dal capitale proprio",
                  "en": "Withdrawals from net assets/equity"
                },
                "values": {},
                "children": []
              }
            ]
          }
        ]
      }
    ]
  },
  "usedCodes": [],
  "unusedCodes": [],
  "entities": {},
  "metadata": {
    "source": "Generated from code definitions",
    "loadedAt": "2025-06-05T09:45:12.538Z",
    "recordCount": 0
  }
};
}
