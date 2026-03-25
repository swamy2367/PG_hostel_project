import mongoose from 'mongoose';

const MONGO_URI = 'mongodb://localhost:27017/hostel_management';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    try {
      await mongoose.connection.db.collection('students').drop();
      console.log('✅ Students collection dropped successfully');
    } catch (error) {
      console.log('ℹ️ Students collection does not exist yet or already empty');
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
