const { Front } = window;
let myContext = null

async function fetchAlerts() {
    try {
        const response = await fetch('https://staging.gohighway.com/core/connect/external_api/v1/alerts', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': 'Bearer eyJraWQiOiJmYmE1ZDA2ZmM5MzIxMTYxOGNjYmMyNGU1MjA0YjNiNTNlYzhlODNlNTdjYzBkNWE1NmQ4NTY4MjY0OWE5MmUxIiwiYWxnIjoiUlMyNTYifQ.eyJVSWQiOjEwOTYxLCJpc19hY3RpdmUiOnRydWUsImlzX2FwaV9rZXkiOnRydWUsInJhbmQiOiI0MWVlMDY5MGYwODdlOGE4ZDBmMmE5NzI0YjM4ZGEwOCIsImV4cCI6MTc0OTA3NDAwNSwiaXNzIjoiaHR0cHM6Ly9zdGFnaW5nLmdvaGlnaHdheS5jb20vIn0.TE5npmVvQ-ghI4zcRGPF6jxb53KamwirfjA3rJFSYZOoMYdtgF0b6saTdEr7u9bjGEel63-BUWvWHazK0fn--KNS4Qi2926IFQURuG4BjA6nYuCepIB27oIbT-qCe0FoCZSfZaJQSGdEO5PcqhcaRu4l9yEe7PPUrzFjb77KfrwxQQKQa7wqXmenpHQqH4MxJXT-kbcHCdMXKxjCo7okNcvZGmB0_CZztwPEVFBmCPzFVvlhmDhuZgtd1XXMAVpqmoNm1TbnX4L93G-VsoGFct6_K-ZelsrkQ7yJXqc-wiwC_MbmF3Afc9f7Ftf5GcA4uaaY3UOSKNwP1r8-SgOSl4bQARXZDMGZTrfTD3y_vAiabZeKzjsPA84S20HatILuvL0c0U4wahQ2HA-SLWu1TUUNvf9Rd9uFrQ-QmsfxSrOgS7s6mUs16g3Qm1QTkpQ-o1Up6tW_ErguvvDefRVYIsGxRJ4XwEPdWi8-7BZdjoVTs5ZZfSsw97RvYPvHDHZvnA5Z6f1tBKybTRj9709sLV9nLLqlvQVq_f3xpfMZ4FqWUTszOHeT88bBKb3oc3GcJelu5JcRE1nFBELcErg83Uc_gQEssgAj5bwEzdpEOtTXPstTIDDgLlqYZlyPzHym6B1iUeH6pncV0ohM3GkpMvWEtt5zs4tNqT0t7gdNQnw'
            }
        });

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
    contextEmail = myContext.conversation.recipient.handle
    console.log(myContext.conversation.recipient.handle)
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
    fetchAlerts();
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
