import Account from "./accounts.model";

export const getAccountById = async (accountID: string) => {
  return await Account.findOne({
    where: { accountID },
    attributes: ["role", "firstName", "lastName", "email"],
  });
};

export const getCognitoErrorMessage = (error: any): string => {
  console.error("❌ Cognito Error:", error);

  switch (error.name) {
    case "NotAuthorizedException":
      return "❌ Incorrect username or password";
    case "UserNotFoundException":
      return "❌ User does not exist";
    case "UserNotConfirmedException":
      return "❌ User is not confirmed. Please check your email.";
    case "PasswordResetRequiredException":
      return "❌ Password reset is required.";
    default:
      return "❌ Login failed";
  }
};
