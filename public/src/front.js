const { Front } = window;

document.addEventListener('DOMContentLoaded', function () {
    console.log(Front)
    if (typeof Front !== 'undefined' && Front.context) {
        Front.contextUpdates.subscribe(context => {
            switch(context.type) {
              case 'noConversation':
                console.log('No conversation selected');
                break;
              case 'singleConversation':
                console.log('Selected conversation:', context.conversation);
                break;
              case 'multiConversations':
                console.log('Multiple conversations selected', context.conversations);
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
  