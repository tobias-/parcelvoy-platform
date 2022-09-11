import { TextMessage, TextResponse } from './TextMessage'
import { TextProvider } from './TextProvider'

export default class PlivoTextProvider extends TextProvider {
    authId!: string
    authToken!: string

    get apiKey(): string {
        return Buffer.from(`${this.authId}:${this.authToken}`).toString('base64')
    }

    async send(message: TextMessage): Promise<TextResponse> {
        const { from, to, text } = message
        const response = await fetch(`https://api.plivo.com/v1/Account/${this.authId}/Message/`, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${this.apiKey}`,
                'Content-Type': 'application/json',
                'User-Agent': 'parcelvoy/v1 (+https://github.com/parcelvoy/platform)',
            },
            body: JSON.stringify({
                src: from,
                dst: to,
                text,
            }),
        })

        if (response.ok) {
            const responseBody = await response.json()
            return {
                message,
                success: true,
                response: responseBody.message_uuid[0],
            }
        } else {
            throw new Error(response.status === 401 ? await response.text() : (await response.json()).error)
        }
    }
}