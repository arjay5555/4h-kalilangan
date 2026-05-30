import { BookOpen } from "lucide-react";
import { motion } from "motion/react";

export default function Constitution() {
  return (
    <div className="container mx-auto px-4 md:px-6 pt-40 pb-24 max-w-4xl">
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center p-4 rounded-full bg-[var(--color-4h-green)]/10 text-[var(--color-4h-green)] mb-6">
          <BookOpen size={32} />
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-[var(--color-ink)] dark:text-white mb-6">
          Constitution and By-Laws
        </h1>
        <p className="text-xl text-slate-500 dark:text-slate-400">
          Of the 4-H Club of Kalilangan, Municipality of Kalilangan, Bukidnon
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-[#111] border border-black/5 dark:border-white/5 shadow-xl rounded-3xl p-8 md:p-12 text-slate-700 dark:text-slate-300 space-y-8 leading-relaxed"
      >
        <section>
          <h2 className="font-display text-2xl font-bold text-[var(--color-ink)] dark:text-white mb-4 uppercase tracking-widest text-center border-b border-black/10 dark:border-white/10 pb-4">Preamble</h2>
          <p>
            We, the members of the 4-H Club of Kalilangan, vanguards of the Filipino youth, imploring the guidance of Almighty God, adhering to the principles of good governance and the ideals of society, recognizing our vital role in nation-building, and committed to uniting our efforts to promote the general welfare, do hereby ordain and promulgate this Constitution and By-Laws.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-[var(--color-ink)] dark:text-white mb-4 mt-12 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">ARTICLE I: NAME AND OFFICE</h2>
          <div className="space-y-4">
            <p><strong>Section 1. Name.</strong> This organization shall be known as the 4-H Club of Kalilangan.</p>
            <p><strong>Section 2. Principal Office.</strong> The principal office of the organization shall be located at the Municipal Agriculture Office (MAO), Municipality of Kalilangan, Province of Bukidnon.</p>
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-[var(--color-ink)] dark:text-white mb-4 mt-12 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">ARTICLE II: VISION, MISSION, AND CORE VALUES</h2>
          <div className="space-y-4">
            <p><strong>Section 1. Vision.</strong> A community of empowered youth who lead with integrity, responsibility, and service, contributing to STEM-driven innovation, modernization, sustainable development, and positive change in society.</p>
            <p><strong>Section 2. Mission.</strong> To develop the Head, Heart, Hands, and Health of young people through hands-on learning in modernized agriculture, Science, Technology, Engineering, and Mathematics (STEM), education, environmental sustainability, lifestyle development, community service, and cultural preservation, in order to build responsible and active youth leaders contributing to nation-building.</p>
            <div>
              <strong>Section 3. Core Values.</strong>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li><strong>Head (Learning and Thinking):</strong> Knowledge, critical thinking, and informed decision-making;</li>
                <li><strong>Heart (Caring and Service):</strong> Compassion, respect, and commitment to community;</li>
                <li><strong>Hands (Action and Skills):</strong> Productivity, teamwork, and practical competence;</li>
                <li><strong>Health (Well-being):</strong> Physical, mental, and social well-being.</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-[var(--color-ink)] dark:text-white mb-4 mt-12 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">ARTICLE III: MEMBERSHIP</h2>
          <div className="space-y-4">
            <p><strong>Section 1. Qualification.</strong> Membership shall be open to Filipino youth aged seven (7) to thirty (30) years old. Membership is inclusive regardless of marital status. Membership shall automatically cease only upon reaching the age of thirty-one (31).</p>
            <div>
              <strong>Section 2. Categories.</strong>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Little 4-Hers: 7–12 years old</li>
                <li>Junior 4-Hers: 13–17 years old</li>
                <li>Senior 4-Hers: 18–21 years old</li>
                <li>Professional 4-Hers: 22–30 years old</li>
              </ul>
            </div>
            <div>
              <strong>Section 3. Rights and Privileges.</strong> All members shall have the right to equal treatment, to participate in all club-sanctioned activities, and to access organizational resources and mentorship.
              <br/><br/>
              <em>Age-Based Governance Rights:</em>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>7–14 years old: Shall not vote nor hold elective office.</li>
                <li>15–17 years old: May vote and hold office, except for the positions of President and Vice-President.</li>
                <li>18–30 years old: Enjoy full voting rights and eligibility for all elective positions.</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-[var(--color-ink)] dark:text-white mb-4 mt-12 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">ARTICLE IV: CODE OF CONDUCT AND ETHICS</h2>
          <div className="space-y-4">
            <p><strong>Section 1. Standard of Conduct.</strong> Members and officers shall uphold integrity, dignity, and honesty.</p>
            <p><strong>Section 2. Non-Partisanship.</strong> The organization remains non-political; no club resources shall be used for partisan political activities.</p>
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-[var(--color-ink)] dark:text-white mb-4 mt-12 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">ARTICLE V: DUTIES AND RESPONSIBILITIES OF MEMBERS</h2>
          <div className="space-y-4">
            <p><strong>Section 1. Loyalty and Compliance.</strong> Every member shall be loyal to the 4-H Club and its principles. Members must strictly adhere to this Constitution and By-Laws and all official policies set by the Executive Board and the Council of Leaders.</p>
            <p><strong>Section 2. Attendance and Active Participation.</strong> Members shall attend regular and special meetings of their respective chapters and the 4-H Club. They are expected to contribute ideas, labor, and support to club-wide projects and initiatives.</p>
            <p><strong>Section 3. Personal Development and "Learn by Doing".</strong> Members shall exert their best efforts to develop their potential through the 4-H "Learn by Doing" philosophy by actively engaging in projects related to agriculture, STEM, and livelihood.</p>
            <p><strong>Section 4. Community Service and Stewardship.</strong> Members are expected to be active volunteers in community outreach, environmental sustainability programs, and cultural preservation initiatives sanctioned by the Club.</p>
            <p><strong>Section 5. Ethical Conduct and Role Modeling.</strong> Every member shall strive to live an upright and exemplary life, serving as a role model for other youth in Kalilangan by demonstrating the 4-H core values in their daily actions.</p>
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-[var(--color-ink)] dark:text-white mb-4 mt-12 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">ARTICLE VI: MISSION ALIGNMENT</h2>
          <p>All programs, projects, and partnerships must strictly align with the Vision and Mission stated in Article II. No activity shall be approved that contradicts the principles of sustainability or youth development.</p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-[var(--color-ink)] dark:text-white mb-4 mt-12 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">ARTICLE VII: EXECUTIVE OFFICERS AND DUTIES</h2>
          <div className="space-y-4">
            <p><strong>Section 1. Composition.</strong> The Executive Board consists of the President, Vice-President, Secretary, Treasurer, Auditor, PIRO, and Business Manager.</p>
            <div>
              <strong>Section 2. Duties.</strong>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li><strong>President:</strong> Chief Executive; presides over meetings; signs official documents; appoints officers to fill vacancies (subject to confirmation).</li>
                <li><strong>Vice-President:</strong> Performs duties of the President in their absence; coordinator for membership growth.</li>
                <li><strong>Secretary:</strong> Records minutes; custodian of all records and member directories.</li>
                <li><strong>Treasurer:</strong> Custodian of funds and properties; maintains financial records; submits reports.</li>
                <li><strong>Auditor:</strong> Verifies financial reports; ensures transparency; conducts internal audits.</li>
                <li><strong>PIRO:</strong> Official spokesperson; manages social media and digital platforms; handles public documentation.</li>
                <li><strong>Business Manager:</strong> Manages physical assets; coordinates procurement logistics and income-generating projects.</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-[var(--color-ink)] dark:text-white mb-4 mt-12 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">ARTICLE VIII: THE COUNCIL OF LEADERS</h2>
          <div className="space-y-4">
            <p><strong>Section 1. Composition.</strong> The Council of Leaders shall be composed of all the Presidents of the various Barangay and School-based chapters within the Municipality of Kalilangan who are not currently serving as members of the Executive Board.</p>
            <div>
              <strong>Section 2. Legislative Authority.</strong> The Council of Leaders serves as the highest legislative body of the 4-H Club. Their functions include:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Reviewing, debating, and voting upon resolutions proposed by the Executive Board;</li>
                <li>Promulgating rules and regulations necessary for the effective operation of all chapters;</li>
                <li>Proposing new policies or programs based on the needs of their respective grassroots members.</li>
              </ul>
            </div>
            <div>
              <strong>Section 3. Ratification Power.</strong> No major decision made by the Executive Board shall be final without the ratification of the Council of Leaders. This includes:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Approval of the Annual Budget and financial plans;</li>
                <li>Confirmation of appointments made by the President to fill vacancies in the Executive Board;</li>
                <li>Ratification of "Ad Referendum" or emergency actions taken by the officers.</li>
              </ul>
            </div>
            <div>
              <strong>Section 4. Oversight and Accountability.</strong> The Council shall monitor the performance of the Executive Officers to ensure transparency and fairness. They have the power to:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Conduct inquiries into the use of club funds or assets;</li>
                <li>Initiate disciplinary proceedings or impeachment cases as defined in Article XII;</li>
                <li>Request progress reports on ongoing livelihood and STEM projects.</li>
              </ul>
            </div>
            <div>
              <strong>Section 5. Grassroots Representation.</strong> The Council of Leaders serves as the primary link between the Municipal administration and the individual chapters. They are responsible for:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Reporting the specific concerns and suggestions of their local members to the Municipal level;</li>
                <li>Ensuring that Municipal-wide programs are successfully implemented at the Barangay and School levels;</li>
                <li>Mobilizing local members for large-scale volunteerism or community projects.</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-[var(--color-ink)] dark:text-white mb-4 mt-12 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">ARTICLE IX: STANDING COMMITTEES</h2>
          <div className="space-y-6">
            <p><strong>Section 1. The Audit & Ethics Committee</strong> shall monitor integrity, assist the Auditor, and ensure transparency.</p>
            <p><strong>Section 2. The Logistics & Restoration Committee</strong> shall manage physical setup and environmental restoration of venues.</p>
            <p><strong>Section 3. The Ways, Means, & Finance Committee</strong> shall lead fundraising, merchandise, and identify sponsors.</p>
            <p><strong>Section 4. The Education & Training Committee</strong> shall organize seminars and ensure the implementation of the "Learn by Doing" philosophy.</p>
            <p><strong>Section 5. The Agriculture, Natural Resources, & Livelihood Committee</strong> shall lead environmental initiatives safely, develop livelihood projects, and promote modernized farming.</p>
            <p><strong>Section 6. The STEM, Innovation, & Technology Committee</strong> shall facilitate STEM programs, digital literacy, and modern scientific applications.</p>
            <p><strong>Section 7. The Service & Extension Committee</strong> shall coordinate outreach, feeding activities, and mobilize volunteers.</p>
            <p><strong>Section 8. The Sports, Recreational, & Wealth (Health) Committee</strong> shall organize fitness programs, mental health advocacy, and healthy lifestyle campaigns.</p>
            <p><strong>Section 9. The Communications, Media, Program, & Cultural Preservation Committee</strong> shall manage official social media, event flows, and local culture preservation.</p>
            <p><strong>Section 10. Ad Hoc Committees:</strong> Temporary committees created by the President for specific tasks.</p>
          </div>
        </section>
        
        <section>
          <h2 className="font-display text-2xl font-bold text-[var(--color-ink)] dark:text-white mb-4 mt-12 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">ARTICLE X: MEETINGS AND ASSEMBLIES</h2>
          <div className="space-y-4">
            <p><strong>Section 1. General Assembly.</strong> Held once a year for major reporting and elections.</p>
            <p><strong>Section 2. Executive Board Meetings.</strong> At least once a month for daily operations.</p>
            <p><strong>Section 3. Joint Quarterly Meetings.</strong> Executive Board and Council of Leaders meet every three months to ratify resolutions and present progress.</p>
            <p><strong>Section 4. Independent Council Meetings.</strong> Council of Leaders may meet separately at any time.</p>
            <p><strong>Section 5. Quorum.</strong> A simple majority (50% + 1) constitutes a quorum.</p>
            <p><strong>Section 6. Ad Referendum.</strong> Emergency actions by the Executive Board must be ratified at the next Joint Quarterly Meeting.</p>
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-[var(--color-ink)] dark:text-white mb-4 mt-12 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">ARTICLE XI - XX: ADDITIONAL PROVISIONS</h2>
          <div className="space-y-4">
            <p><strong>Article XI: Elections and Tenure -</strong> Held 2nd Saturday of March. 2-year term. Turnovers within 15 days.</p>
            <p><strong>Article XII: Vacancy, Sanctions, and Removal -</strong> Handles disciplinary actions, reprimands, suspensions, or expulsions for misconduct.</p>
            <p><strong>Article XIII: Supervision and Advisory -</strong> Supervised by MAO and ATI. The Municipal 4-H Coordinator serves as official Adviser.</p>
            <p><strong>Article XIV: Finances -</strong> Funded by allocations, partnerships, self-generated income, and a ONE-TIME membership fee.</p>
            <div>
              <strong>Article XV: General Provisions -</strong> 
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li><strong>Pledge:</strong> "I pledge my Head to clearer thinking, my Heart to greater loyalty, my Hands to larger service, and my Health to better living..."</li>
                <li><strong>Motto:</strong> "To Make the Best Better."</li>
                <li><strong>Slogan:</strong> "Learning by Doing."</li>
              </ul>
            </div>
            <p><strong>Article XVI: Alumni and Mentorship -</strong> Members age 31 become Alumni mentors without voting power.</p>
            <p><strong>Article XVII: Data Privacy -</strong> Compliance with RA 10173.</p>
            <p><strong>Article XVIII: Amendments -</strong> Requires 3/4 vote of Council of Leaders and ratification by at least 10% of members.</p>
          </div>
        </section>

      </motion.div>
    </div>
  );
}
