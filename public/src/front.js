const { Front } = window;
let myContext = null

function searchMCNumbers(body) {
    const regex = /MC\d+/g;

    const matches = body.match(regex);

    return matches || [];
}

function searchDOTNumbers(body) {
    const regex = /DOT\d+/g;

    const matches = body.match(regex);
    
    return matches || [];
}

async function getNumbers() {
    try {
        let mcNums = [];
        let dotNums = [];
        
        const data = await myContext.listMessages();
        
        for (let result of data["results"]) {
            let body = result["content"]["body"];
            mcNums.push(...searchMCNumbers(body));
            dotNums.push(...searchDOTNumbers(body));
        }

        let contextEmail = myContext.conversation.recipient.handle;
        return { email: contextEmail, mc: mcNums, dot: dotNums };
    } catch (error) {
        console.error(error);
        return { error: "Failed to retrieve numbers", details: error.message };
    }
}


export async function fetchHighway() {
    let reqData = await getNumbers(); 

    try {
        const response = await fetch('/highway', {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(reqData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        const event = new CustomEvent('highwayDataUpdated', { detail: data });
        window.dispatchEvent(event); 

        return data; 
    } catch (error) {
        console.error('Error fetching alerts:', error);
        throw error; 
    }
}


export async function moveEmail() {

    if (typeof Front !== 'undefined' && Front.context) {
        try {
            if (myContext.type === 'singleConversation') {
                const conversationId = myContext.conversation.id;

                const targetInboxId = 'inb_e5wgs';

                await myContext.move(targetInboxId)
                console.warn(`Conversation ${conversationId} moved to inbox ${targetInboxId}`);
            } else {
                console.warn('No single conversation selected or invalid context type.');
            }
        } catch (error) {
            console.error('Error moving email:', error);
        }
    } else {
        console.warn('Front SDK not available - Cannot move email.');
    }
}

document.addEventListener('DOMContentLoaded', function () {
    if (typeof Front !== 'undefined' && Front.context) {
        Front.contextUpdates.subscribe(async context => {
            switch(context.type) {
              case 'noConversation':
                break;
              case 'singleConversation':
                myContext = context
                await fetchHighway();
                break;
              case 'multiConversations':
                myContext = context
                break;
              default:
                console.error(`Unsupported context type: ${context.type}`);
                break;
            }
          });
    } else {
      console.warn('Front SDK not available - Using test data.');
      document.getElementById('email-subject').innerText =
        'Subject: Test Email (Local)';
    }
});
