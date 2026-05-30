import React, { useState, useEffect } from "react";
import { Target, ShieldCheck, HeartHandshake, BookOpen, Upload, RefreshCw } from "lucide-react";
import { collection, doc, setDoc, getDocs, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../lib/firebase";

const PILLARS_LIST = ["Agriculture", "Education", "Environmental", "Art and Culture", "Health & Wellness", "STEM", "Leadership", "Community Service", "Livelihood"];

export default function Join() {
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    suffix: "",
    sex: "",
    civilStatus: "",
    birthDate: "",
    age: "",
    category: "",
    chapterType: "",
    primaryChapterType: "",
    barangayChapter: "",
    schoolChapter: "",
    highestEducationalAttainment: "",
    degree: "",
    addressRegion: "",
    addressProvince: "",
    addressMunicipality: "",
    addressBarangay: "",
    addressStreet: "",
    contactNumber: "",
    email: "",
    occupation: "",
    pillars: [] as string[]
  });
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState<{ memberId: string, name: string } | null>(null);

  const [regions, setRegions] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [municipalities, setMunicipalities] = useState<any[]>([]);
  const [barangays, setBarangays] = useState<any[]>([]);
  const [regionCode, setRegionCode] = useState("");
  const [provCode, setProvCode] = useState("");
  const [munCode, setMunCode] = useState("");
  const [schoolChaptersList, setSchoolChaptersList] = useState<any[]>([]);
  const [barangayChaptersList, setBarangayChaptersList] = useState<any[]>([]);
  const [acceptingNewMembers, setAcceptingNewMembers] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "site"), snap => {
      if (snap.exists() && snap.data().acceptingNewMembers === false) {
        setAcceptingNewMembers(false);
      } else {
        setAcceptingNewMembers(true);
      }
    });

    fetch("https://psgc.gitlab.io/api/regions/")
      .then(res => res.json())
      .then(data => setRegions(data))
      .catch(console.error);

    getDocs(collection(db, "council")).then(snap => {
      const b: any[] = [];
      const s: any[] = [];
      snap.forEach(d => {
        const data = d.data();
        if (data.type === "Barangay Based") b.push(data);
        if (data.type === "School Based") s.push(data);
      });
      setBarangayChaptersList(b);
      setSchoolChaptersList(s);
    }).catch(console.error);
  }, []);

  const getCategory = (age: number) => {
    if (age >= 7 && age <= 12) return "Little 4-Hers";
    if (age >= 13 && age <= 17) return "Junior 4-Hers";
    if (age >= 18 && age <= 21) return "Senior 4-Hers";
    if (age >= 22 && age <= 30) return "Professional 4-Hers";
    if (age > 30) return "Alumni";
    return "";
  };

  const calculateAge = (dob: string) => {
    if (!dob) return { age: "", cat: "" };
    const diff = Date.now() - new Date(dob).getTime();
    const ageDate = new Date(diff); 
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    return { age: age.toString(), cat: getCategory(age) };
  };

  const handleDOBChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dob = e.target.value;
    const { age, cat } = calculateAge(dob);
    setFormData({ ...formData, birthDate: dob, age, category: cat });
  };

  const handleSubmit = async () => {
    // Validation
    const requiredFields = [
      formData.firstName, formData.lastName, formData.sex, formData.civilStatus,
      formData.birthDate, formData.highestEducationalAttainment, formData.degree,
      formData.addressRegion, formData.addressProvince, formData.addressMunicipality,
      formData.addressBarangay, formData.addressStreet, formData.contactNumber,
      formData.email, formData.occupation, formData.chapterType, formData.primaryChapterType
    ];
    if (requiredFields.some(f => !f) || formData.pillars.length === 0) {
      alert("Please fill in all mandatory fields (Profile picture is optional).");
      return;
    }
    if ((formData.chapterType === "Barangay Based" || formData.chapterType === "Both") && !formData.barangayChapter) {
      alert("Please select a Barangay Chapter.");
      return;
    }
    if ((formData.chapterType === "School Based" || formData.chapterType === "Both") && !formData.schoolChapter) {
      alert("Please select a School Chapter.");
      return;
    }
    if (formData.chapterType === "Both" && !formData.primaryChapterType) {
      alert("Please select your primary chapter category.");
      return;
    }

    try {
      setIsSubmitting(true);
      
      let pictureUrl = "";
      if (pictureFile) {
        const storageRef = ref(storage, `members/${Date.now()}_${pictureFile.name}`);
        await uploadBytes(storageRef, pictureFile);
        pictureUrl = await getDownloadURL(storageRef);
      }

      // Generate member ID
      const yearSuffix = new Date().getFullYear().toString().slice(-2);
      const prefix = `${yearSuffix}4H`;
      
      const membersSnap = await getDocs(collection(db, "members"));
      let maxCounter = -1;
      membersSnap.forEach(d => {
         const id = d.id;
         if (id.startsWith(prefix)) {
            const countStr = id.replace(prefix, '');
            const count = parseInt(countStr, 10);
            if (!isNaN(count) && count > maxCounter) {
               maxCounter = count;
            }
         }
      });
      const nextCounter = maxCounter + 1;
      const paddedCounter = nextCounter.toString().padStart(4, '0');
      const memberId = `${prefix}${paddedCounter}`;

      await setDoc(doc(db, "members", memberId), {
        ...formData,
        memberId: memberId,
        picture: pictureUrl,
        address: {
          region: formData.addressRegion,
          province: formData.addressProvince,
          municipality: formData.addressMunicipality,
          barangay: formData.addressBarangay,
          street: formData.addressStreet,
        },
        registrationDate: new Date().toISOString().split('T')[0],
        status: "Pending",
        interests: formData.pillars
      });
      setSubmittedData({
        memberId,
        name: `${formData.firstName} ${formData.lastName}`
      });
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Failed to submit application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitAgain = () => {
    setFormData({
      firstName: "", middleName: "", lastName: "", suffix: "", sex: "", civilStatus: "",
      birthDate: "", age: "", category: "", chapterType: "Barangay", primaryChapterType: "", barangayChapter: "", schoolChapter: "", highestEducationalAttainment: "", degree: "",
      addressRegion: "", addressProvince: "", addressMunicipality: "", addressBarangay: "",
      addressStreet: "", contactNumber: "", email: "", occupation: "", pillars: []
    });
    setPictureFile(null);
    setRegionCode("");
    setProvCode("");
    setMunCode("");
    setProvinces([]);
    setMunicipalities([]);
    setBarangays([]);
    setIsSuccess(false);
    setSubmittedData(null);
  };

  return (
    <div className="container mx-auto px-4 pt-32 pb-12 max-w-7xl">
      <div className="text-center mb-12">
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white">Join the 4-H Club</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Take the first step towards empowering yourself and your community in Kalilangan.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
        {/* Left Side: Information */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-2xl font-bold font-display mb-6 flex items-center gap-3 text-slate-900 dark:text-white">
              <BookOpen className="text-[var(--color-4h-green)] shrink-0" size={24} />
              ARTICLE III: MEMBERSHIP
            </h2>
            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
              <div>
                <strong className="text-slate-900 dark:text-white inline-block mb-1">Section 1. Qualification.</strong>
                <p>Membership shall be open to Filipino youth aged seven (7) to thirty (30) years old. Membership is inclusive regardless of marital status. Membership shall automatically cease only upon reaching the age of thirty-one (31).</p>
              </div>
              <div>
                <strong className="text-slate-900 dark:text-white inline-block mb-1">Section 2. Categories.</strong>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li><strong className="text-slate-800 dark:text-slate-200">Little 4-Hers:</strong> 7–12 years old</li>
                  <li><strong className="text-slate-800 dark:text-slate-200">Junior 4-Hers:</strong> 13–17 years old</li>
                  <li><strong className="text-slate-800 dark:text-slate-200">Senior 4-Hers:</strong> 18–21 years old</li>
                  <li><strong className="text-slate-800 dark:text-slate-200">Professional 4-Hers:</strong> 22–30 years old</li>
                </ul>
              </div>
              <div>
                <strong className="text-slate-900 dark:text-white inline-block mb-1">Section 3. Rights and Privileges.</strong>
                <p>All members shall have the right to equal treatment, to participate in all club-sanctioned activities, and to access organizational resources and mentorship.</p>
                <div className="mt-3 bg-white dark:bg-slate-800 p-4 rounded-xl">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-2">Age-Based Governance Rights:</h4>
                  <ul className="space-y-2">
                    <li><strong className="text-slate-800 dark:text-slate-200">7–14 years old:</strong> Shall not vote nor hold elective office.</li>
                    <li><strong className="text-slate-800 dark:text-slate-200">15–17 years old:</strong> May vote and hold office, except for the positions of President and Vice-President.</li>
                    <li><strong className="text-slate-800 dark:text-slate-200">18–30 years old:</strong> Enjoy full voting rights and eligibility for all elective positions.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-2xl font-bold font-display mb-6 flex items-center gap-3 text-slate-900 dark:text-white">
              <ShieldCheck className="text-[var(--color-4h-green)] shrink-0" size={24} />
              ARTICLE IV: CODE OF CONDUCT AND ETHICS
            </h2>
            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
              <div>
                <strong className="text-slate-900 dark:text-white inline-block mb-1">Section 1. Standard of Conduct.</strong>
                <p>Members and officers shall uphold integrity, dignity, and honesty.</p>
              </div>
              <div>
                <strong className="text-slate-900 dark:text-white inline-block mb-1">Section 2. Non-Partisanship.</strong>
                <p>The organization remains non-political; no club resources shall be used for partisan political activities.</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-2xl font-bold font-display mb-6 flex items-center gap-3 text-slate-900 dark:text-white">
              <HeartHandshake className="text-[var(--color-4h-green)] shrink-0" size={24} />
              ARTICLE V: DUTIES AND RESPONSIBILITIES
            </h2>
            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex gap-4">
                 <div className="w-8 h-8 rounded-full bg-[var(--color-4h-green)]/10 text-[var(--color-4h-green)] flex items-center justify-center shrink-0 font-bold">1</div>
                 <div>
                    <strong className="text-slate-900 dark:text-white block mb-1">Loyalty and Compliance</strong>
                    <p>Every member shall be loyal to the 4-H Club and its principles. Members must strictly adhere to this Constitution and By-Laws and all official policies.</p>
                 </div>
              </div>
              <div className="flex gap-4">
                 <div className="w-8 h-8 rounded-full bg-[var(--color-4h-green)]/10 text-[var(--color-4h-green)] flex items-center justify-center shrink-0 font-bold">2</div>
                 <div>
                    <strong className="text-slate-900 dark:text-white block mb-1">Attendance and Active Participation</strong>
                    <p>Members shall attend regular and special meetings of their respective chapters and the 4-H Club. They are expected to contribute ideas, labor, and support to club-wide projects.</p>
                 </div>
              </div>
              <div className="flex gap-4">
                 <div className="w-8 h-8 rounded-full bg-[var(--color-4h-green)]/10 text-[var(--color-4h-green)] flex items-center justify-center shrink-0 font-bold">3</div>
                 <div>
                    <strong className="text-slate-900 dark:text-white block mb-1">Personal Development and "Learn by Doing"</strong>
                    <p>Members shall exert their best efforts to develop their potential through the 4-H "Learn by Doing" philosophy.</p>
                 </div>
              </div>
              <div className="flex gap-4">
                 <div className="w-8 h-8 rounded-full bg-[var(--color-4h-green)]/10 text-[var(--color-4h-green)] flex items-center justify-center shrink-0 font-bold">4</div>
                 <div>
                    <strong className="text-slate-900 dark:text-white block mb-1">Community Service and Stewardship</strong>
                    <p>Members are expected to be active volunteers in community outreach and environmental sustainability programs.</p>
                 </div>
              </div>
              <div className="flex gap-4">
                 <div className="w-8 h-8 rounded-full bg-[var(--color-4h-green)]/10 text-[var(--color-4h-green)] flex items-center justify-center shrink-0 font-bold">5</div>
                 <div>
                    <strong className="text-slate-900 dark:text-white block mb-1">Ethical Conduct and Role Modeling</strong>
                    <p>Every member shall strive to live an upright and exemplary life, serving as a role model for other youth in Kalilangan.</p>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="lg:col-span-3">
          {!acceptingNewMembers ? (
            <div className="bg-white dark:bg-[#111] p-12 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center relative overflow-hidden">
               <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-red-400 to-red-600"></div>
               <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                 <ShieldCheck size={32} />
               </div>
               <h4 className="text-2xl font-bold font-display mb-2">Registration Closed</h4>
               <p className="text-slate-600 dark:text-slate-400">
                 We are not currently accepting new members. Please check back later or follow our social media for announcements regarding our next recruitment drive.
               </p>
            </div>
          ) : (
          <div className="bg-white dark:bg-[#111] p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-left relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-yellow-400 to-[var(--color-4h-green)]"></div>
            <h3 className="text-xl font-bold font-display mb-6">Application Form</h3>
            
            {isSuccess ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck size={32} />
                </div>
                <h4 className="text-2xl font-bold font-display mb-2">Application Submitted!</h4>
                <p className="text-slate-600 dark:text-slate-400 mb-6">Thank you for applying. We will review your application and get back to you soon.</p>
                
                {submittedData && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 inline-block text-left mb-8">
                    <p className="text-sm text-slate-500 mb-1">Generated Member ID</p>
                    <p className="text-3xl font-mono font-bold text-[var(--color-4h-green)] mb-3">{submittedData.memberId}</p>
                    <p className="text-sm text-slate-500 mb-1">Applicant Name</p>
                    <p className="font-bold text-lg">{submittedData.name}</p>
                  </div>
                )}
                
                <button onClick={submitAgain} className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center gap-2 mx-auto">
                  <RefreshCw size={18} /> Submit Another Application
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col items-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl mb-6 bg-slate-50 dark:bg-slate-900/50">
                  <div className="w-24 h-24 bg-slate-200 dark:bg-slate-800 rounded-full mb-4 overflow-hidden border-4 border-white dark:border-[#111] shadow-md flex items-center justify-center">
                    {pictureFile ? (
                       <img src={URL.createObjectURL(pictureFile)} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                       <Upload size={32} className="text-slate-400" />
                    )}
                  </div>
                  <label className="cursor-pointer bg-white dark:bg-slate-800 px-4 py-2 rounded-xl text-sm font-bold shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                    Upload Profile Picture (Optional)
                    <input type="file" accept="image/*" onChange={e => { if(e.target.files && e.target.files[0]) setPictureFile(e.target.files[0]) }} className="hidden" />
                  </label>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-bold mb-2 uppercase tracking-wide">Date Joined (Auto)</label>
                  <input type="date" value={new Date().toISOString().split('T')[0]} readOnly className="w-full sm:w-1/3 px-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-slate-500 font-medium outline-none cursor-not-allowed" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-2 uppercase tracking-wide">First Name *</label>
                    <input type="text" value={formData.firstName} onChange={e=>setFormData({...formData, firstName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-[var(--color-4h-green)] transition-colors" placeholder="Juan" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-2 uppercase tracking-wide">Middle Name</label>
                    <input type="text" value={formData.middleName} onChange={e=>setFormData({...formData, middleName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-[var(--color-4h-green)] transition-colors" placeholder="Garcia" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-2 uppercase tracking-wide">Last Name *</label>
                    <input type="text" value={formData.lastName} onChange={e=>setFormData({...formData, lastName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-[var(--color-4h-green)] transition-colors" placeholder="Dela Cruz" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-2 uppercase tracking-wide">Suffix (Jr. Sr. I. II...)</label>
                    <input type="text" value={formData.suffix} onChange={e=>setFormData({...formData, suffix: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-[var(--color-4h-green)] transition-colors" placeholder="e.g. Jr." />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-2 uppercase tracking-wide">Sex *</label>
                    <select value={formData.sex} onChange={e=>setFormData({...formData, sex: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-[var(--color-4h-green)] transition-colors text-slate-700 dark:text-slate-300 appearance-none">
                      <option value="">Select Sex</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-2 uppercase tracking-wide">Civil Status *</label>
                    <select value={formData.civilStatus} onChange={e=>setFormData({...formData, civilStatus: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-[var(--color-4h-green)] transition-colors text-slate-700 dark:text-slate-300 appearance-none">
                      <option value="">Select Status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Separated">Separated</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-2 uppercase tracking-wide">Date of Birth *</label>
                    <input type="date" value={formData.birthDate} onChange={handleDOBChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-[var(--color-4h-green)] transition-colors" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold mb-2 uppercase tracking-wide">Age</label>
                      <input type="text" readOnly value={formData.age} className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-500 font-medium" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-2 uppercase tracking-wide text-slate-500 truncate" title="Category (Auto)">Category</label>
                      <input type="text" readOnly value={formData.category} className="w-full px-3 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-[var(--color-4h-green)] font-bold text-xs" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-2 uppercase tracking-wide">Highest Educ. Attainment *</label>
                    <input type="text" value={formData.highestEducationalAttainment} onChange={e=>setFormData({...formData, highestEducationalAttainment: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-[var(--color-4h-green)] transition-colors" placeholder="e.g. College Level" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-2 uppercase tracking-wide">Degree/Course *</label>
                    <input type="text" value={formData.degree} onChange={e=>setFormData({...formData, degree: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-[var(--color-4h-green)] transition-colors" placeholder="e.g. BS Agriculture" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-2 uppercase tracking-wide">Chapter Type *</label>
                    <select value={formData.chapterType} onChange={e=>{
                      const ct = e.target.value;
                      setFormData({...formData, chapterType: ct, barangayChapter: (ct === "School Based") ? "" : formData.barangayChapter, schoolChapter: (ct === "Barangay Based") ? "" : formData.schoolChapter});
                    }} className="w-full px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-[var(--color-4h-green)] transition-colors text-slate-700 dark:text-slate-300 appearance-none">
                      <option value="">Select an option</option>
                      <option value="Barangay Based">Barangay Based</option>
                      <option value="School Based">School Based</option>
                      <option value="Both">Both (Barangay & School Based)</option>
                    </select>
                  </div>
                  {(formData.chapterType === "Barangay Based" || formData.chapterType === "Both") && (
                    <div>
                      <label className="block text-xs font-bold mb-2 uppercase tracking-wide">Barangay Chapter Name *</label>
                      <select value={formData.barangayChapter} onChange={e=>setFormData({...formData, barangayChapter: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-[var(--color-4h-green)] transition-colors text-slate-700 dark:text-slate-300 appearance-none">
                        <option value="">Select Barangay Chapter</option>
                        {barangayChaptersList.map((ch, i) => (
                           <option key={i} value={ch.role}>{ch.role}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {(formData.chapterType === "School Based" || formData.chapterType === "Both") && (
                    <div>
                      <label className="block text-xs font-bold mb-2 uppercase tracking-wide">School Chapter Name *</label>
                      <select value={formData.schoolChapter} onChange={e=>setFormData({...formData, schoolChapter: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-[var(--color-4h-green)] transition-colors text-slate-700 dark:text-slate-300 appearance-none">
                        <option value="">Select School Chapter</option>
                        {schoolChaptersList.map((ch, i) => (
                           <option key={i} value={ch.role}>{ch.role}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {formData.chapterType === "Both" && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold mb-2 uppercase tracking-wide">Primary Chapter * (For Federation Record Counting)</label>
                      <select value={formData.primaryChapterType} onChange={e=>setFormData({...formData, primaryChapterType: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-[var(--color-4h-green)] transition-colors text-slate-700 dark:text-slate-300 appearance-none">
                        <option value="">Select Primary Chapter Category</option>
                        <option value="Barangay Based">Barangay Based</option>
                        <option value="School Based">School Based</option>
                      </select>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-bold mb-2 uppercase tracking-wide">Address *</label>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    <select value={regionCode} onChange={e => {
                      const code = e.target.value;
                      setRegionCode(code);
                      const tReg = regions.find(r=>r.code===code);
                      setFormData({...formData, addressRegion: tReg ? tReg.name : "", addressProvince: "", addressMunicipality: "", addressBarangay: ""});
                      setProvCode(""); setMunCode("");
                      fetch(`https://psgc.gitlab.io/api/regions/${code}/provinces/`).then(r=>r.json()).then(p => {
                        setProvinces(p);
                        if (p.length === 0 && code) {
                          fetch(`https://psgc.gitlab.io/api/regions/${code}/cities-municipalities/`).then(r=>r.json()).then(setMunicipalities);
                        } else {
                          setMunicipalities([]); setBarangays([]);
                        }
                      }).catch(() => setProvinces([]));
                    }} className="w-full px-3 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-[var(--color-4h-green)] transition-colors text-sm appearance-none">
                      <option value="">Select Region *</option>
                      {regions.map(r => <option key={r.code} value={r.code}>{r.name}</option>)}
                    </select>

                    <select value={provCode} onChange={e => {
                      const code = e.target.value;
                      setProvCode(code);
                      const tProv = provinces.find(p=>p.code===code);
                      setFormData({...formData, addressProvince: tProv ? tProv.name : "", addressMunicipality: "", addressBarangay: ""});
                      setMunCode(""); setBarangays([]);
                      if(code) {
                        fetch(`https://psgc.gitlab.io/api/provinces/${code}/cities-municipalities/`).then(r=>r.json()).then(setMunicipalities).catch(()=>setMunicipalities([]));
                      }
                    }} disabled={provinces.length === 0 && regionCode !== ""} className="w-full px-3 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-[var(--color-4h-green)] transition-colors text-sm appearance-none disabled:opacity-50">
                      <option value="">Select Province</option>
                      {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                    </select>

                    <select value={munCode} onChange={e => {
                      const code = e.target.value;
                      setMunCode(code);
                      const tMun = municipalities.find(m=>m.code===code);
                      setFormData({...formData, addressMunicipality: tMun ? tMun.name : "", addressBarangay: ""});
                      if(code) {
                        fetch(`https://psgc.gitlab.io/api/cities-municipalities/${code}/barangays/`).then(r=>r.json()).then(setBarangays).catch(()=>setBarangays([]));
                      }
                    }} disabled={municipalities.length === 0} className="w-full px-3 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-[var(--color-4h-green)] transition-colors text-sm appearance-none disabled:opacity-50">
                      <option value="">Select Municipality *</option>
                      {municipalities.map(m => <option key={m.code} value={m.code}>{m.name}</option>)}
                    </select>

                    <select value={formData.addressBarangay} onChange={e => setFormData({...formData, addressBarangay: e.target.value})} disabled={barangays.length === 0} className="w-full px-3 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-[var(--color-4h-green)] transition-colors text-sm appearance-none disabled:opacity-50">
                      <option value="">Select Barangay *</option>
                      {barangays.map(b => <option key={b.code} value={b.name}>{b.name}</option>)}
                    </select>

                    <input type="text" value={formData.addressStreet} onChange={e=>setFormData({...formData, addressStreet: e.target.value})} className="w-full px-3 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-[var(--color-4h-green)] transition-colors text-sm" placeholder="Street / Purok *" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-2 uppercase tracking-wide">Contact Number *</label>
                    <input type="tel" value={formData.contactNumber} onChange={e=>setFormData({...formData, contactNumber: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-[var(--color-4h-green)] transition-colors" placeholder="09xxxxxxxxx" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-2 uppercase tracking-wide">Email *</label>
                    <input type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-[var(--color-4h-green)] transition-colors" placeholder="juan@example.com" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold mb-2 uppercase tracking-wide">Occupation / Position *</label>
                    <input type="text" value={formData.occupation} onChange={e=>setFormData({...formData, occupation: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-[var(--color-4h-green)] transition-colors" placeholder="e.g. Student" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-2 uppercase tracking-wide">Preferred Pillars (Select all that apply) *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {PILLARS_LIST.map(pillar => (
                      <label key={pillar} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:border-[var(--color-4h-green)] transition">
                        <input type="checkbox" checked={formData.pillars.includes(pillar)}
                          onChange={e => {
                            if (e.target.checked) setFormData({...formData, pillars: [...formData.pillars, pillar]});
                            else setFormData({...formData, pillars: formData.pillars.filter(p => p !== pillar)});
                          }}
                          className="w-4 h-4 text-[var(--color-4h-green)] rounded border-slate-300 focus:ring-[var(--color-4h-green)]" 
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{pillar}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="w-full py-4 bg-[var(--color-4h-green)] text-white font-bold rounded-xl hover:shadow-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50">
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </button>
                <p className="text-xs text-center text-slate-500 mt-4 leading-relaxed">
                  By submitting this application, you agree to uphold the Constitution, Code of Conduct, and Duties as outlined.
                </p>
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
