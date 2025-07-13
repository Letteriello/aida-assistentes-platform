
import axios from 'axios';

export interface EvolutionAPIClient {
  sendTextMessage(instanceId: string, jid: string, text: string): Promise<any>;
  // Add other methods for sending different message types (media, buttons, etc.)
}

class EvolutionAPIClientImpl implements EvolutionAPIClient {
  private readonly axiosInstance;

  constructor(private readonly apiKey: string, private readonly apiHost: string) {
    this.axiosInstance = axios.create({
      baseURL: this.apiHost,
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.apiKey
      }
    });
  }

  async sendTextMessage(instanceId: string, jid: string, text: string): Promise<any> {
    try {
      const response = await this.axiosInstance.post(`/message/sendText/${instanceId}`,
        {
          number: jid,
          options: {
            delay: 1200,
            presence: 'composing'
          },
          textMessage: {
            text: text
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error sending text message:', error);
      throw error;
    }
  }
}

export const getEvolutionAPIClient = (apiKey: string, apiHost: string): EvolutionAPIClient => {
  return new EvolutionAPIClientImpl(apiKey, apiHost);
};
