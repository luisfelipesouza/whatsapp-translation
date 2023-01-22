const axios = require("axios");

const facebookUrl = process.env.FACEBOOK_URL;
const requestTimeout = 3000

exports.sendMessage = async (option) => {
    return await axios({
        method: "POST",
        timeout: requestTimeout,
        url: `${facebookUrl}/${option.phoneNumberId}/messages/`,
        data: {
            messaging_product: "whatsapp",
            to: option.sendTo,
            text: {
                body: option.message
            }
        },
        headers: {
            'Authorization': `Bearer ${option.token}`,
            'Content-type': 'application/json'
        }
    })
}

exports.sendInteractiveMessage = async (option, payload) => {
    return await axios({
        method: "POST",
        timeout: requestTimeout,
        url: `${facebookUrl}/${option.phoneNumberId}/messages/`,
        data: {
            messaging_product: "whatsapp",
            to: option.sendTo,
            type: "interactive",
            interactive: payload,
        },
        headers: {
            'Authorization': `Bearer ${option.token}`,
            'Content-type': 'application/json'
        }
    })
}

exports.readMessage = async (option) => {
    return await axios({
        method: "POST",
        timeout: requestTimeout,
        url: `${facebookUrl}/${option.phoneNumberId}/messages/`,
        data: {
            messaging_product: "whatsapp",
            status: "read",
            message_id: option.messageId
        },
        headers: {
            'Authorization': `Bearer ${option.token}`,
            'Content-type': 'application/json'
        }
    })
}

exports.sendAudio = async (option) => {
    return await axios({
        method: "POST",
        timeout: requestTimeout,
        url: `${facebookUrl}/${option.phoneNumberId}/messages/`,
        data: {
            messaging_product: "whatsapp",
            to: option.sendTo,
            type: "audio",
            audio: { 
                link: option.audioUrl 
            }
        },
        headers: {
            'Authorization': `Bearer ${option.token}`,
            'Content-type': 'application/json'
        }
    })
}

exports.getAudioUrl = async (option) => {
    const url =  await axios({
        method: "GET",
        timeout: requestTimeout,
        url: `${facebookUrl}/${option.audioId}`,
        headers: {
            'Authorization': `Bearer ${option.token}`,
            'Content-type': 'application/json'
        }
    })

    return url.data.url
}

exports.getAudioFile = async(option) => {
    const file =  await axios({
        method: "GET",
        timeout: requestTimeout,
        responseType: "arraybuffer",
        url: option.audioUrl,
        headers: {
            'Authorization': `Bearer ${option.token}`,
            'Content-type': 'application/json'
        }
    })

    return file.data

}