import axios from 'axios';
import 'dotenv/config'

export class GoogleAdsSerive {
    constructor() {
        this.accessToken = null;
        this.tokenExpiresAt = null;
    }

    // Código legado, feito caso a autenticação padrão não funcionasse

    async authenticate() {
        try {
            const res = await axios.post('https://oauth2.googleapis.com/token', {
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                refresh_token: process.env.REFRESH_TOKEN,
                grant_type: 'refresh_token'
            });

            this.accessToken = res.data.access_token;
            this.tokenExpiresAt = Date.now() + (res.data.expires_in * 1000);
            return res.data
        } catch (error) {
            console.error('Erro na autenticação:', error.response?.data || error.message);
        }
    }

    async ensureValidToken() {
        if (!this.accessToken || Date.now() >= this.tokenExpiresAt - 60000) {
            await this.authenticate();
        }
    }

    async listAccounts() {
        await this.ensureValidToken();

        const query = {
            query: "SELECT customer_client.client_customer, customer_client.descriptive_name FROM customer_client"
        };

        try {
            const response = await axios.post(
                `https://googleads.googleapis.com/v19/customers/${process.env.LOGIN_CUSTOMER_ID}/googleAds:search`,
                query,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'developer-token': process.env.DEVELOPER_TOKEN,
                        'Content-Type': 'application/json',
                        'login-customer-id': process.env.LOGIN_CUSTOMER_ID
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('Erro ao listar contas:', error.response?.data || error.message);
        }
    }
}