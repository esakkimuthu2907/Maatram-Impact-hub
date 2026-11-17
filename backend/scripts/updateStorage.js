const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../services/storage.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. In createEvent, ensure status is set
if (!code.includes('status: eventData.status || "Upcoming",')) {
  code = code.replace(
    'eventStatus: "Upcoming",',
    'status: eventData.status || "Upcoming",\r\n      eventStatus: "Upcoming",'
  );
}

// 2. In updateEvent, support non-ObjectId and title matching in Application.updateMany
const oldUpdateMongo = 'if (mongoose.isValidObjectId(idStr)) {\r\n          const e = await Event.findByIdAndUpdate(idStr, update, { new: true }).lean();\r\n          if (isMarkingCompleted) {\r\n            try {\r\n              await Application.updateMany(\r\n                {\r\n                  $or: [{ eventId: idStr }, { opportunityId: idStr }],';

const newUpdateMongo = 'let e = null;\r\n        if (mongoose.isValidObjectId(idStr)) {\r\n          e = await Event.findByIdAndUpdate(idStr, update, { new: true }).lean();\r\n        } else {\r\n          e = await Event.findOneAndUpdate({ $or: [{ id: idStr }, { _id: idStr }] }, update, { new: true }).lean();\r\n        }\r\n        if (e && isMarkingCompleted) {\r\n          try {\r\n            const appMatchOr = [{ eventId: idStr }, { opportunityId: idStr }];\r\n            if (e.title) {\r\n              appMatchOr.push({ opportunityTitle: new RegExp(e.title.trim(), "i") });\r\n            }\r\n            await Application.updateMany(\r\n              {\r\n                $or: appMatchOr,';

if (code.includes('const e = await Event.findByIdAndUpdate(idStr, update, { new: true }).lean();')) {
  code = code.replace(oldUpdateMongo, newUpdateMongo);
}

// 3. In getApplicationsByEvent, merge MongoDB and db.json
const oldGetApps = '        const apps = await Application.find({ $or: queryOr }).lean();\r\n        if (apps && apps.length > 0) return apps.map((a) => ({ ...a, id: a._id.toString() }));\r\n      } catch (err) {\r\n        console.warn("[Storage] getApplicationsByEvent query notice:", err.message);\r\n      }\r\n    }\r\n\r\n    const db = readDB();\r\n    const apps = (db.applications || []).filter(\r\n      (a) =>\r\n        (a.opportunityId || "").toString() === idStr ||\r\n        (a.eventId || "").toString() === idStr ||\r\n        (eventTitle && (a.opportunityTitle || "").toLowerCase() === (eventTitle || "").toLowerCase())\r\n    );\r\n    return apps.map((a) => ({ ...a, id: (a.id || a._id || "").toString() }));';

const newGetApps = '        const mongoApps = await Application.find({ $or: queryOr }).lean();\r\n        if (mongoApps && mongoApps.length > 0) {\r\n          list = mongoApps.map((a) => ({ ...a, id: a._id.toString() }));\r\n        }\r\n      } catch (err) {\r\n        console.warn("[Storage] getApplicationsByEvent query notice:", err.message);\r\n      }\r\n    }\r\n\r\n    const db = readDB();\r\n    const jsonApps = (db.applications || []).filter(\r\n      (a) =>\r\n        (a.opportunityId || "").toString() === idStr ||\r\n        (a.eventId || "").toString() === idStr ||\r\n        (eventTitle && (a.opportunityTitle || "").toLowerCase().trim() === (eventTitle || "").toLowerCase().trim())\r\n    );\r\n    const merged = [...list];\r\n    for (const ja of jsonApps) {\r\n      const jaId = (ja.id || ja._id || "").toString();\r\n      const existingIdx = merged.findIndex((m) => (m.id || m._id || "").toString() === jaId);\r\n      if (existingIdx === -1) {\r\n        merged.push({ ...ja, id: jaId });\r\n      } else {\r\n        if (ja.status === "Completed") {\r\n          merged[existingIdx] = { ...merged[existingIdx], ...ja, id: jaId, status: "Completed" };\r\n        }\r\n      }\r\n    }\r\n    return merged;';

const searchStr = 'async getApplicationsByEvent(eventId, eventTitle = null) {\r\n    const idStr = (eventId || "").toString().trim();\r\n    if (getIsConnected()) {';
if (code.includes(searchStr)) {
  code = code.replace(
    searchStr,
    'async getApplicationsByEvent(eventId, eventTitle = null) {\r\n    const idStr = (eventId || "").toString().trim();\r\n    let list = [];\r\n    if (getIsConnected()) {'
  );
  code = code.replace(oldGetApps, newGetApps);
}

// 4. In updateApplicationStatus, handle non-ObjectId in MongoDB
const oldAppStatusMongo = '        if (mongoose.isValidObjectId(idStr)) {\r\n          const doc = await Application.findByIdAndUpdate(idStr, { status, ...(notes ? { notes } : {}) }, { new: true }).lean();\r\n          if (doc) app = { ...doc, id: doc._id.toString() };\r\n        }';
const newAppStatusMongo = '        if (mongoose.isValidObjectId(idStr)) {\r\n          const doc = await Application.findByIdAndUpdate(idStr, { status, ...(notes ? { notes } : {}) }, { new: true }).lean();\r\n          if (doc) app = { ...doc, id: doc._id.toString() };\r\n        } else {\r\n          const doc = await Application.findOneAndUpdate({ $or: [{ id: idStr }, { _id: idStr }, { referenceId: idStr }] }, { status, ...(notes ? { notes } : {}) }, { new: true }).lean();\r\n          if (doc) app = { ...doc, id: (doc._id || doc.id).toString() };\r\n        }';
code = code.replace(oldAppStatusMongo, newAppStatusMongo);

// 5. In updateApplication, handle non-ObjectId in MongoDB
const oldUpdateAppMongo = '        if (mongoose.isValidObjectId(idStr)) {\r\n          const Application = require("../models/Application");\r\n          const doc = await Application.findByIdAndUpdate(idStr, { $set: updates }, { new: true }).lean();\r\n          if (doc) updatedApp = { ...doc, id: doc._id.toString() };\r\n        }';
const newUpdateAppMongo = '        const Application = require("../models/Application");\r\n        if (mongoose.isValidObjectId(idStr)) {\r\n          const doc = await Application.findByIdAndUpdate(idStr, { $set: updates }, { new: true }).lean();\r\n          if (doc) updatedApp = { ...doc, id: doc._id.toString() };\r\n        } else {\r\n          const doc = await Application.findOneAndUpdate({ $or: [{ id: idStr }, { _id: idStr }, { referenceId: idStr }] }, { $set: updates }, { new: true }).lean();\r\n          if (doc) updatedApp = { ...doc, id: (doc._id || doc.id).toString() };\r\n        }';
code = code.replace(oldUpdateAppMongo, newUpdateAppMongo);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Update completed successfully.');
