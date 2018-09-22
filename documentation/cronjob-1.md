# Cronjob-1
===============
located : cronJobs/cronJobs.js
Method: checkAuctionExpiry()
#### To check auction expires.

> This job will run at 13:00 everyday to check auction expiration.
 * If auction an auction expired and no bid or buyout on auction, an mail sent to seller to inform about auction exoireation.
 * If auction expired and some bid/bids on that auction, last bid considered as buyout price and auction will sent to admin for sell out confirmation. Also an email will be sent to buyer and seller.

