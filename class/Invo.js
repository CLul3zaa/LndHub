var lightningPayReq = require('bolt11');

export class Invo {
  constructor(redis, bitcoindrpc, lightning) {
    this._redis = redis;
    this._bitcoindrpc = bitcoindrpc;
    this._lightning = lightning;
    this._decoded = false;
    this._bolt11 = false;
    this._isPaid = null;
  }

  setInvoice(bolt11) {
    this._bolt11 = bolt11;
  }

  async getIsMarkedAsPaidInDatabase() {
    if (!this._bolt11) throw new Error('bolt11 is not provided');
    const decoded = lightningPayReq.decode(this._bolt11);
    let paymentHash = false;
    for (const tag of decoded.tags) {
      if (tag.tagName === 'payment_hash') {
        paymentHash = tag.data;
      }
    }
    if (!paymentHash) throw new Error('Could not find payment hash in invoice tags');
    return await this._getIsPaymentHashMarkedPaidInDatabase(paymentHash);
  }

  async markAsPaidInDatabase() {
    if (!this._bolt11) throw new Error('bolt11 is not provided');
    const decoded = lightningPayReq.decode(this._bolt11);
    let paymentHash = false;
    for (const tag of decoded.tags) {
      if (tag.tagName === 'payment_hash') {
        paymentHash = tag.data;
      }
    }
    if (!paymentHash) throw new Error('Could not find payment hash in invoice tags');
    return await this._setIsPaymentHashPaidInDatabase(paymentHash, true);
  }

  async markAsUnpaidInDatabase() {
    if (!this._bolt11) throw new Error('bolt11 is not provided');
    const decoded = lightningPayReq.decode(this._bolt11);
    let paymentHash = false;
    for (const tag of decoded.tags) {
      if (tag.tagName === 'payment_hash') {
        paymentHash = tag.data;
      }
    }
    if (!paymentHash) throw new Error('Could not find payment hash in invoice tags');
    return await this._setIsPaymentHashPaidInDatabase(paymentHash, false);
  }

  async _setIsPaymentHashPaidInDatabase(paymentHash, isPaid) {
    if (isPaid) {
      return await this._redis.set('ispaid_' + paymentHash, 1);
    } else {
      return await this._redis.del('ispaid_' + paymentHash);
    }
  }

  async _getIsPaymentHashMarkedPaidInDatabase(paymentHash) {
    return await this._redis.get('ispaid_' + paymentHash);
  }

  /**
   * Queries LND ofr all user invoices
   *
   * @return {Promise<array>}
   */
  async listInvoices() {
    return new Promise((resolve, reject) => {
      this._lightning.listInvoices(
        {
          num_max_invoices: 9000111,
        },
        function(err, response) {
          if (err) return reject(err);
          resolve(response);
        },
      );
    });
  }
}