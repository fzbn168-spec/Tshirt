export const getBankInfo = () => ({
  bankName: process.env.BANK_NAME,
  accountName: process.env.BANK_ACCOUNT_NAME,
  accountNo: process.env.BANK_ACCOUNT_NO,
  swiftCode: process.env.BANK_SWIFT_CODE,
  address: process.env.BANK_ADDRESS,
});

export const getWesternUnionInfo = () => ({
  receiverName: process.env.WU_RECEIVER_NAME,
  city: process.env.WU_CITY,
  country: process.env.WU_COUNTRY,
});
