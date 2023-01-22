const whatsapp = require("./whatsapp")
const database = require("./database")

const languageMap = {
    "english" : {
        "pt-en" : {
            sourceLanguage: "pt",
            targetLanguage: "en",
            pollyLanguage: "en-US",
            pollyVoice: "Salli"
        },
        "en-pt": {
            sourceLanguage: "en",
            targetLanguage: "pt",
            pollyLanguage: "pt-BR",
            pollyVoice: "Camila"
        }
    },
    "french" : {
        "pt-fr" : {
            sourceLanguage: "pt",
            targetLanguage: "fr",
            pollyLanguage: "fr-FR",
            pollyVoice: "Celine"
        },
        "fr-pt": {
            sourceLanguage: "fr",
            targetLanguage: "pt",
            pollyLanguage: "pt-BR",
            pollyVoice: "Camila"
        }
    },
    "spanish" : {
        "pt-es" : {
            sourceLanguage: "pt",
            targetLanguage: "es",
            pollyLanguage: "es-ES",
            pollyVoice: "Conchita"
        },
        "es-pt": {
            sourceLanguage: "es",
            targetLanguage: "pt",
            pollyLanguage: "pt-BR",
            pollyVoice: "Camila"
        }
    },
    "deutsch" : {
        "pt-de" : {
            sourceLanguage: "pt",
            targetLanguage: "de",
            pollyLanguage: "de-DE",
            pollyVoice: "Marlene"
        },
        "de-pt": {
            sourceLanguage: "de",
            targetLanguage: "pt",
            pollyLanguage: "pt-BR",
            pollyVoice: "Camila"
        }
    }
}

const languagePayload = {
    type: "list",
    body: {
        text: "Selecione a linguagem do tradutor..."
    },
    action: {
        button: "Disponíveis",
        sections: [
            {
                rows: [
                    {
                        id: "!en",
                        title: "Inglês"
                    },
                    {
                        id: "!fr",
                        title: "Francês"
                    },
                    {
                        id: "!de",
                        title: "Alemão"
                    },
                    {
                        id: "!es",
                        title: "Espanhol"
                    }
                ]
            }
        ]
    }
}
 
translationPayload = (language, languageCode) => {
    return {
        type: "button",
        body: {
          text: `*${language}* selecionado. \nSelecione o tipo de tradução:`
        },
        action: {
            buttons: [
                {
                type: "reply",
                reply: {
                    id: `${languageCode}-pt`,
                    title: `${language} > Português`
                }
                },
                {
                type: "reply",
                reply: {
                    id: `pt-${languageCode}`,
                    title: `Português > ${language}`
                }
                }
            ]
        }
    }
}

exports.translateConfig = (language, translate) => {
    return languageMap[language][translate]
}

exports.setupLanguage = async (message, language, option) => {

    let languageMessage = "";

    if (message === "!setup"){
        return await whatsapp.sendInteractiveMessage(option, languagePayload);
    }

    if (message === "!en"){

        languageMessage = "Inglês";

        await database.updateItem({
            key: option.sendTo,
            language: "english",
        })

        await database.updateTranslate({
            key: option.sendTo,
            translate: "en-pt",
        })

        return await whatsapp.sendInteractiveMessage(option, translationPayload(languageMessage, message));
    }

    if (message === "!es"){

        languageMessage = "Espanhol";

        await database.updateItem({
            key: option.sendTo,
            language: "spanish",
        })

        await database.updateTranslate({
            key: option.sendTo,
            translate: "es-pt",
        })

        return await whatsapp.sendInteractiveMessage(option, translationPayload(languageMessage, message));
    }

    if (message === "!fr"){

        languageMessage = "Francês";

        await database.updateItem({
            key: option.sendTo,
            language: "french",
        })

        await database.updateTranslate({
            key: option.sendTo,
            translate: "fr-pt",
        })

        return await whatsapp.sendInteractiveMessage(option, translationPayload(languageMessage, message));
    }

    if (message === "!de"){

        languageMessage = "Alemão";

        await database.updateItem({
            key: option.sendTo,
            language: "deutsch",
        })

        await database.updateTranslate({
            key: option.sendTo,
            translate: "de-pt",
        })

        return await whatsapp.sendInteractiveMessage(option, translationPayload(languageMessage, message));

    }

    if (message === "pt-!en"){

        await whatsapp.sendMessage({
            ...option,
            message: "*Português* > *Inglês* selecionado.",
        })

        return await database.updateTranslate({
            key: option.sendTo,
            translate: "pt-en",
        })

    } 

    if (message === "pt-!fr"){

        await whatsapp.sendMessage({
            ...option,
            message: "*Português* > *Francês* selecionado.",
        })

        return await database.updateTranslate({
            key: option.sendTo,
            translate: "pt-fr",
        })

    } 

    if (message === "pt-!de"){

        await whatsapp.sendMessage({
            ...option,
            message: "*Português* > *Alemão* selecionado.",
        })

        return await database.updateTranslate({
            key: option.sendTo,
            translate: "pt-de",
        })

    } 

    if (message === "pt-!es"){

        await whatsapp.sendMessage({
            ...option,
            message: "*Português* > *Espanhol* selecionado.",
        })

        return await database.updateTranslate({
            key: option.sendTo,
            translate: "pt-es",
        })

    } 

    if (message === "!en-pt"){

        await whatsapp.sendMessage({
            ...option,
            message: "*Inglês* > *Português* selecionado.",
        })

        return await database.updateTranslate({
            key: option.sendTo,
            translate: "en-pt",
        })

    } 

    if (message === "!fr-pt"){

        await whatsapp.sendMessage({
            ...option,
            message: "*Francês* > *Português* selecionado.",
        })

        return await database.updateTranslate({
            key: option.sendTo,
            translate: "fr-pt",
        })

    } 
    
    if (message === "!de-pt"){

        await whatsapp.sendMessage({
            ...option,
            message: "*Alemão* > *Português* selecionado.",
        })

        return await database.updateTranslate({
            key: option.sendTo,
            translate: "de-pt",
        })

    } 
    
    if (message === "!es-pt"){

        await whatsapp.sendMessage({
            ...option,
            message: "*Espanhol* > *Português* selecionado.",
        })

        return await database.updateTranslate({
            key: option.sendTo,
            translate: "es-pt",
        })

    }

    return;
}