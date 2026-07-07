//Get ll users except the logged in user
import User from "../models/User.js"
import Message from "../models/Message.js"
import cloudinary from "../lib/cloudinary.js";
import {io,userSocketMap} from "../server.js"

export const getUsersForSidebar = async (req, res) => {
    try {
        const userId = req.user._id;
        const filteredUser = await User.find({ _id: { $ne: userId } }).select("-password");

        // Count number of messages not seen

        const unseenMessages = {}
        const promises = filteredUser.map(async (user) => {
            const messages = await Message.find({ senderId: user._id, receiverId: userId, seen: false });
            if (messages.length > 0) {
                unseenMessages[user._id] = messages.length;
            }
        })
        await Promise.all(promises);
        res.json({ success: true, users: filteredUser, unseenMessages })
    } catch (error) { 
        res.json({ success: false, message: error.message })

    }
}


//get all messages for selected user

export const getMessages = async (req, res) => { 
    try {
        const { id: selectedUserId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                {
                    senderId: myId, receiverId: selectedUserId
                },
                {
                    senderId: selectedUserId, receiverId: myId
                }
            ]
        }).sort({ createdAt: 1 }); // oldest → newest
        await Message.updateMany({ senderId: selectedUserId, receiverId: myId }, { seen: true })
        res.json({ success: true, messages })


    } catch (error) {
 
        res.json({ success: false, message: error.message })
    }
}

//api to mark message as seen using message 

export const markMessageAsSeen = async (req, res) => {
    try {
        const { id } = req.params;
        await Message.findByIdAndUpdate(id, { seen: true })
        res.json({ success: true })

    } catch (error) {
 
        res.json({ success: false, message: error.message })
    }
}

// Send Message to selected use

export const sendMessage = async(req,res)=>{

    try {
        
      const {

    encryptedMessage,

    nonce,

    image

} = req.body;
        const receiverId = req.params.id;
        const senderId = req.user._id;

        let imageUrl;
        const sender = await User.findById(senderId).select("publicKey");
        if(image){
            const uploadResponse = await cloudinary.uploader.upload(image)
            imageUrl = uploadResponse.secure_url;


        }
        const newMessage = await Message.create({
            senderId,
            receiverId,
            encryptedMessage,
            nonce, 
            senderPublicKey: sender.publicKey,
            image:imageUrl


        })

        //emit the new message to receiver's socket

        const receiverSocketId = userSocketMap[receiverId];
        if(receiverSocketId){
            io.to(receiverSocketId).emit("newMessage",newMessage)
        }

        res.json({success:true,newMessage});
    } catch (error) {
         
        res.json({ success: false, message: error.message })
    
    }
}