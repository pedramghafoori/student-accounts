// /Users/pedramghafoori/Desktop/Web_Course_Upload2.0/Student Accounts/lib/courseCodes.js

// A mapping of short course codes to their friendly names
export const courseCodeMap = {
    BC: "Bronze Cross",
    BCC: "Bronze Cross Challenge Exam",
    BM: "Bronze Medallion",
    BMBC: "Bronze Combo",
    BMC: "Bronze Medallion Challenge Exam",
    CPRA: "CPR-A",
    CPRB: "CPR-B",
    CPRC: "CPR-C",
    CPRHCP: "CPR-HCP",
    EFA: "Emergency First Aid with CPR-B (EFA)",
    FAI: "First Aid Instructor",
    LSI: "Lifesaving Instructor",
    NL: "National Lifeguard - Pool (NL)",
    NLI: "National Lifeguard Instructor",
    NLR: "National Lifeguard - Pool Recertification",
    SFA: "Standard First Aid with CPR-C (SFA)",
    SFAR: "Standard First Aid with CPR-C Recertification",
    SWI: "Swim Instructor",
    TR: "Trainer Course"
};

export function getCourseCode(friendlyName) {
    for (const [code, name] of Object.entries(courseCodeMap)) {
        if (name === friendlyName) {
            return code;
        }
    }
    return null;
}