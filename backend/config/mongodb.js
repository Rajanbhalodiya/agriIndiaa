import mongoose from "mongoose"

const connectDB = async () => {
    mongoose.connection.on('connected', async () => {
        console.log("Database Connected")
        try {
            await mongoose.connection.db.collection('advisors').dropIndex('email_1')
            console.log("Dropped legacy email_1 index from advisors collection")
        } catch (err) {
            // Index might not exist or already dropped
        }
    })

    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/agriindia`)
    } catch (error) {
        console.log("Cloud MongoDB Connection Failed. Trying Local Fallback...", error.message)
        await mongoose.connect(`mongodb://127.0.0.1:27017/agriindia`)
    }
}

export default connectDB