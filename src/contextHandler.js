export function getEmailContext() {
    Front.context.get()
      .then((context) => {
  
        if (context.message && context.message.subject) {
          document.getElementById('email-subject').innerText =
            'Subject: ' + context.message.subject;
        } else {
          document.getElementById('email-subject').innerText =
            'No subject available.';
        }
      })
      .catch((error) => {
        console.error('Failed to fetch context:', error);
        document.getElementById('email-subject').innerText =
          'Error fetching context.';
      });
  }
  