import mongoose from "mongoose";

const day = 24*60*60*1000;
const gamifySchema = new mongoose.Schema({
  points: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  streakDays: { type: Number, default: 0 },
  lastActiveAt: { type: Date, default: null },
  badges: [{ type: String }]
},{ _id:false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["user","admin"], default: "user" },
  profile: {
    headline: String,
    skills: [String],
    experience: [{ company: String, role: String, duration: String, details: String }],
    education: [{ school: String, degree: String, year: String }],
    resumeText: String
  },
  gamify: { type: gamifySchema, default: () => ({}) }
}, { timestamps: true });

userSchema.methods.applyActivity = function(pointsEarned){
  const now = new Date();
  const last = this.gamify.lastActiveAt;
  if (last) {
    const diff = now - last;
    if (diff > 2*day) this.gamify.streakDays = 1; // reset
    else if (diff > day) this.gamify.streakDays += 1; // new day
  } else {
    this.gamify.streakDays = 1;
  }
  this.gamify.lastActiveAt = now;
  this.gamify.points += pointsEarned;
  // simple leveling: 1 + floor(points/200)
  this.gamify.level = 1 + Math.floor(this.gamify.points / 200);
  const badges = new Set(this.gamify.badges);
  if (this.gamify.points >= 100) badges.add("Rising Star");
  if (this.gamify.streakDays >= 7) badges.add("7-Day Streak");
  if (this.gamify.level >= 5) badges.add("Level 5 Achiever");
  this.gamify.badges = Array.from(badges);
};

export default mongoose.model("User", userSchema);
