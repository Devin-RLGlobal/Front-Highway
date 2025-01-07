const { Front } = window;
let myContext = null

function getMCNumbers(){
    myContext.listMessages().then((data) => {
        for (let i in data["results"]){
            console.log(i)
        }
      }).catch((error) => {
        console.error(error); // Handles any errors
      });
}

function getDOTNumbers(){
    myContext.listMessages().then((data) => {
        console.log(data); // Prints the data to the console
      }).catch((error) => {
        console.error(error); // Handles any errors
      });
}

async function fetchEmail() {
    await getMCNumbers()
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
    console.log(myContext.conversation)
    let contextEmail = myContext.conversation.recipient.handle
    console.log(contextEmail)
    console.log('moveEmail function called!');

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
    console.log(myContext)
}

document.addEventListener('DOMContentLoaded', function () {
    if (typeof Front !== 'undefined' && Front.context) {
        Front.contextUpdates.subscribe(async context => {
            switch(context.type) {
              case 'noConversation':
                console.log('No conversation selected');
                break;
              case 'singleConversation':
                console.log('Selected conversation:', context.conversation);
                myContext = context
                await fetchEmail();
                break;
              case 'multiConversations':
                console.log('Multiple conversations selected', context.conversations);
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
