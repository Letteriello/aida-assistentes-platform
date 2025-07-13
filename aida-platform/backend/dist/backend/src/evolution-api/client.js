import axios from 'axios';
class EvolutionAPIClientImpl {
    apiKey;
    apiHost;
    axiosInstance;
    constructor(apiKey, apiHost) {
        this.apiKey = apiKey;
        this.apiHost = apiHost;
        this.axiosInstance = axios.create({
            baseURL: this.apiHost,
            headers: {
                'Content-Type': 'application/json',
                'apikey': this.apiKey
            }
        });
    }
    async sendTextMessage(instanceId, jid, text) {
        try {
            const response = await this.axiosInstance.post(`/message/sendText/${instanceId}`, {
                number: jid,
                options: {
                    delay: 1200,
                    presence: 'composing'
                },
                textMessage: {
                    text: text
                }
            });
            return response.data;
        }
        catch (error) {
            console.error('Error sending text message:', error);
            throw error;
        }
    }
}
export const getEvolutionAPIClient = (apiKey, apiHost) => {
    return new EvolutionAPIClientImpl(apiKey, apiHost);
};
