export function getEmailContext() {
    // Fetch the email context
    Front.context.get()
      .then((context) => {
        console.log('Context:', context);
  
        // Display the email subject
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
  