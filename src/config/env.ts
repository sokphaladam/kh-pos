type MailServerConfig = {
  FROM_EMAIL: string;
  HOST: string;
  USERNAME: string;
  PASSWORD: string;
};

export const env = {
  public: {
    mainDatabase: process.env.DB_MAIN,
    mailServer: process.env.MAIL_SERVER
      ? (JSON.parse(process.env.MAIL_SERVER) as MailServerConfig)
      : ({} as MailServerConfig),
  },
};
