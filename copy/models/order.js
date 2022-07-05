const mongoose = require('mongoose');
const { schema } = require('./product');

const Schema = mongoose.Schema;

const orderSchema = new mongoose.Schema({
    products: [{
        product: {type:Object , required:true},
        quantity: {type: Number, required: true}
    }],
    user: {
        email: {
            type: String,
            required: true
        },
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        }
    }
})


module.exports =  mongoose.model('Order',orderSchema);