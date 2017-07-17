**Propy**

* It's main contract, creates `Users` contract in constructor.
* Store arrays of address created contracts (`properties[]`, `deeds[]`).
* Creates other contracts(`createDeed()`, `createProperty()`).
* Can update user data and assign global (`setUser()`). Also assign global broker and escrow agent address (`brokerId`, `agentId`).
* Can assign inspector for deed (`setInspector()`).
* Events: `LogSender`, `PropertyCreated`, `DeedCreated`.


**Users**

* Store users data (`users[]`).
* `struct User`: user data fields.
* Create & Update user (`set()`).
* Get user data (`get()` for sender & `getOther()` for others).
* remove user (`remove()`)


**Property**

* Store property data and status.
* Have `PropertyOwnerChanged` event.
* Returns owner address (`getowner()`).
* Can `setOwner` for the property.
* Can update property data (only url for example).

**Deed**

* Store deed data and status (`status`).
* Store invites statuses (`invitedSeller`, `invitedEscrowAgent`). Can be changed from (`confirmSeller()` & `confirmEscrowAgent()`).
* Store signs statuses for PA (`buyerSigned`, `sellerSigned`).
* Store users contracts addresses (`selledId`, `buyerId`, `brokerId`, `agentId`, inspectorId).
* Store property contract address (`propertyId`).
* Store vars (`signed`, `submited`, `distributed`) - for Escrow agent actions
* Store `metaPA` and `metaTD` - info for PA & TD (urls for now). Can be changed using `deedPA()` and `deedmetaTD()`.
* Function `sign()` - for sign action.
* Function `setStatus()` - can be called form Escrow agent account.
* Functions `sendInviteToEscrowAgent()` & `sendInviteToSeller()` also change deed status and can be called from broker account.
* Can assign inspector for deed (`setInspector()`).
