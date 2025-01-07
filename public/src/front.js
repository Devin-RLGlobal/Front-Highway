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

function getNumbers(){
    myContext.listMessages().then((data) => {
        for (let i in data["results"]){
            let body = data["results"][i]["content"]["body"]
            console.log(searchMCNumbers(body))
            console.log(searchDOTNumbers(body))
        }
      }).catch((error) => {
        console.error(error);
      });
}

async function fetchHighway() {
    await getNumbers()
    try {
        const response = await fetch('/email');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error fetching alerts:', error);
    }
}



export async function moveEmail() {
    let contextEmail = myContext.conversation.recipient.handle
    console.log(contextEmail)

    if (typeof Front !== 'undefined' && Front.context) {
        try {
            if (myContext.type === 'singleConversation') {
                const conversationId = myContext.conversation.id;

                const targetInboxId = 'inb_e5wgs';

                await myContext.move(targetInboxId)
                console.log(`Conversation ${conversationId} moved to inbox ${targetInboxId}`);
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
                console.log('No conversation selected');
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
