const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2')// imported the mongoose-paginate
const Schema = mongoose.Schema;

const WeightSchema = new Schema({
  userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true}, 
  weight: { 
    type: Number, 
    required: true },
  date: { 
    type: Date, 
    default: Date.now, 
    required: true },
});

WeightSchema.index({ user: 1, date: 1 }, { unique: true });

WeightSchema.plugin(mongoosePaginate);

const Weight = mongoose.model('Weight', WeightSchema);

module.exports = Weight;
