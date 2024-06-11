import sendgrid from '@sendgrid/mail'

sendgrid.setApiKey(process.env.SENDGRID_API_KEY!)

export const sendMemberInvite = async (to: string, signupLink: string) => {
  const msg = {
    to,
    from: process.env.EMAIL_FROM!,
    subject: "You've been invited to Sphinx!",
    templateId: process.env.SENDGRID_MEMBER_INVITE_EMAIL_TEMPLATE!,
    dynamicTemplateData: {
      signupLink,
    },
  }
  await sendgrid.send(msg)
}
