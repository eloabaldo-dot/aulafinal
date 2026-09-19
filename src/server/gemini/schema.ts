/**
 * Esquema JSON Schema para o Structured Outputs da API Gemini do Google.
 * Corresponde 1:1 com a interface SmartTripItinerary definida no contrato de dados canônico.
 */

export const geminiItineraryResponseSchema = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      description: 'Título conciso e inspirador da viagem (5 a 100 caracteres).',
    },
    summary: {
      type: 'string',
      description: 'Resumo geral do plano de viagem destacando o estilo (20 a 400 caracteres).',
    },
    destinationId: {
      type: 'string',
      description: 'ID canônico do destino fornecido.',
    },
    startDate: {
      type: 'string',
      description: 'Data de início da viagem no formato YYYY-MM-DD.',
    },
    endDate: {
      type: 'string',
      description: 'Data de término da viagem no formato YYYY-MM-DD.',
    },
    alerts: {
      type: 'array',
      items: { type: 'string' },
      description: 'Alertas globais da viagem (segurança, transporte, bagagem).',
    },
    days: {
      type: 'array',
      description: 'Lista ordenada de dias da viagem.',
      items: {
        type: 'object',
        properties: {
          dayNumber: {
            type: 'integer',
            description: 'Número sequencial do dia (1-indexed).',
          },
          date: {
            type: 'string',
            description: 'Data do dia no formato ISO YYYY-MM-DD.',
          },
          theme: {
            type: 'string',
            description: 'Tema ou foco central do dia (3 a 80 caracteres).',
          },
          weather: {
            type: 'object',
            properties: {
              hasForecast: { type: 'boolean' },
              tempMin: { type: 'number', nullable: true },
              tempMax: { type: 'number', nullable: true },
              condition: {
                type: 'string',
                enum: [
                  'Ensolarado',
                  'Parcialmente Nublado',
                  'Nublado',
                  'Chuvoso',
                  'Tempestade',
                  'Neve',
                  'Desconhecido',
                ],
              },
              observation: { type: 'string' },
            },
            required: ['hasForecast', 'tempMin', 'tempMax', 'condition', 'observation'],
          },
          alerts: {
            type: 'array',
            items: { type: 'string' },
          },
          activities: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                placeId: {
                  type: 'string',
                  description: 'ID canônico EXATO de um lugar fornecido em allowed_places.',
                },
                name: {
                  type: 'string',
                  description: 'Nome factual da atração.',
                },
                period: {
                  type: 'string',
                  enum: ['manha', 'tarde', 'noite'],
                },
                timeSlot: {
                  type: 'string',
                  description: 'Horário sugerido no formato HH:MM (ex: 09:30).',
                },
                rationale: {
                  type: 'string',
                  description: 'Justificativa concisa da escolha (10 a 200 caracteres).',
                },
                estimatedDuration: {
                  type: 'string',
                  nullable: true,
                },
                curatorTip: {
                  type: 'string',
                  nullable: true,
                },
              },
              required: ['placeId', 'name', 'period', 'timeSlot', 'rationale'],
            },
          },
        },
        required: ['dayNumber', 'date', 'theme', 'weather', 'alerts', 'activities'],
      },
    },
  },
  required: ['title', 'summary', 'destinationId', 'startDate', 'endDate', 'alerts', 'days'],
};
