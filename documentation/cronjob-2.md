# Cronjob-2
===============
located : cronJobs/cronJobs.js
Method: checkTransactionStatus()
#### To check 6+ confirmation of an transaction.

> This job will run on every 6 hour to check 6+ confirmation of an transaction.
 * First it will check, whether it is from buyer side or admin side.
 * If it is from admin side and transaction has completed 6+ confirmation, transaction status will be changed to confirm transaction and an mail will be send to seller about reedmtion.

 * If transaction is from buyer side, following operations will be performed.
     1. If some transaction is unconfirmed, then this cron job will pickup hash of this transaction and check for 6+ confirmation using third party API.
     2. If tranaction has completed 6+ transactions, status will changed to confirmed transaction.
     3. Auction documents will be encrypted using buyer's public key.(Can only decrypt using private key of buyer).
     4. Documnets will be sent to buyer via mail and iform about transaction success.
     5. All the auction ammount will be added to admin's BTC address.
     6. After one more transaction will be made for seller. Admin will send auction amount to seller after diducting commission and transaction charge.
     7. An email will send to buyer that trnsaction has on the way to 6+ confirmation.

