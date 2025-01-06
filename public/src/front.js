const { Front } = window;
let myContext = null

export async function moveEmail() {
    console.log('moveEmail function called!');
    myContext = null
    if (typeof Front !== 'undefined' && Front.context) {
        try {
            const context = Front.context;
            if (context.type === 'singleConversation') {
                const conversationId = context.conversation.id;

                const targetInboxId = 'test';

                await Front.apiRequest({
                    method: 'PUT',
                    path: `/conversations/${conversationId}/inbox`,
                    data: { inbox_id: targetInboxId }
                });
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
    console.log(Front);
    if (typeof Front !== 'undefined' && Front.context) {
        Front.contextUpdates.subscribe(context => {
            switch(context.type) {
              case 'noConversation':
                console.log('No conversation selected');
                break;
              case 'singleConversation':
                console.log('Selected conversation:', context.conversation);
                myContext = context
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
