-- SpeakFlow Lessons Seed Data
-- 25 lessons: 5 scenarios × 5 levels
-- First 2 of each scenario are free (is_pro_only=false), levels 3-5 are Pro

INSERT INTO lessons (scenario, level, title, description, target_phrases, conversation_system_prompt, fp_reward, is_pro_only, sort_order) VALUES

-- ============================================================
-- JOB INTERVIEW (levels 1-5)
-- ============================================================

(
  'job_interview',
  1,
  'Tell Me About Yourself',
  'Master the classic opening interview question. Learn to deliver a confident, structured self-introduction that highlights your professional background.',
  ARRAY[
    'I have been working in this field for five years',
    'My background is in software engineering',
    'I am passionate about solving complex problems',
    'I am excited about this opportunity'
  ],
  'You are a friendly HR interviewer at a mid-sized tech company. The candidate is interviewing for a software engineer position. Start by asking "Tell me about yourself." Listen carefully to their response and ask one follow-up question about their experience. Be encouraging but professional. Assess their communication clarity and confidence.',
  15,
  false,
  10
),

(
  'job_interview',
  2,
  'Strengths and Weaknesses',
  'Confidently discuss your professional strengths and frame weaknesses as growth opportunities. A critical skill for any job interview.',
  ARRAY[
    'My greatest strength is my ability to communicate effectively',
    'I am a detail-oriented professional',
    'I have been working to improve my public speaking skills',
    'I see this as an opportunity for growth'
  ],
  'You are an experienced recruiter at a Fortune 500 company conducting a mid-level management interview. After a brief greeting, ask the candidate about their greatest strength and then their biggest weakness. React naturally to their answers — probe deeper if answers are vague. Be professional and maintain a neutral but engaged tone.',
  20,
  false,
  20
),

(
  'job_interview',
  3,
  'Behavioral Interview: STAR Method',
  'Master the Situation-Task-Action-Result framework for behavioral questions. Tell compelling stories about your professional achievements.',
  ARRAY[
    'Let me give you a specific example',
    'The situation was that our team faced a tight deadline',
    'I took the initiative to coordinate with stakeholders',
    'As a result, we delivered the project on time'
  ],
  'You are a senior hiring manager at a consulting firm. You specialize in behavioral interviewing using the STAR method. Ask the candidate: "Tell me about a time when you had to manage a difficult stakeholder." Probe for specific details about the situation, their actions, and measurable results. Push back if answers are vague.',
  30,
  true,
  30
),

(
  'job_interview',
  4,
  'Salary Negotiation',
  'Navigate the delicate conversation about compensation with confidence. Learn professional phrases to negotiate salary without damaging rapport.',
  ARRAY[
    'Based on my research and experience, I am looking for a salary in the range of',
    'I am very excited about this role and believe my skills justify',
    'Is there flexibility in the compensation package',
    'I would be happy to discuss the total compensation including benefits'
  ],
  'You are an HR manager at a technology company who has just offered a candidate a position. The candidate will attempt to negotiate salary. Be realistic — you have some flexibility (up to 10% above your initial offer) but not unlimited. Act professionally and be willing to discuss total compensation including equity, benefits, and bonuses if salary negotiation stalls.',
  40,
  true,
  40
),

(
  'job_interview',
  5,
  'Executive Interview: Strategic Vision',
  'Demonstrate executive-level thinking by discussing company strategy, market trends, and your vision for the role. For C-suite and senior leadership positions.',
  ARRAY[
    'I have analyzed your competitive landscape and believe',
    'The key strategic priority I would focus on in the first 90 days is',
    'From a market perspective, the opportunity lies in',
    'I would align the team around three core objectives'
  ],
  'You are the CEO of a growing technology company conducting a final interview for a VP of Product role. Ask the candidate: "If you were to join us tomorrow, what would be your strategic priorities for the first 90 days?" Engage in a high-level strategic discussion. Challenge their assumptions and ask about how they would handle competing priorities and limited resources.',
  60,
  true,
  50
),

-- ============================================================
-- PRESENTATION (levels 1-5)
-- ============================================================

(
  'presentation',
  1,
  'Opening a Presentation',
  'Start your business presentations with impact. Master the hook, agenda, and purpose statement that capture your audience immediately.',
  ARRAY[
    'Good morning everyone, thank you for joining us today',
    'Today I will be presenting',
    'By the end of this presentation you will understand',
    'Let me start with a question'
  ],
  'You are an audience member at a business presentation. The speaker is a junior employee presenting quarterly sales results to a team of 10. Respond naturally to their opening — nod along mentally, ask for clarification if something is unclear, and provide encouraging but honest reactions. If the opening is weak, ask what the presentation is about.',
  15,
  false,
  110
),

(
  'presentation',
  2,
  'Presenting Data and Charts',
  'Explain complex data and visualizations clearly and persuasively. Learn to highlight key insights and make numbers tell a story.',
  ARRAY[
    'As you can see from this chart',
    'The data clearly shows that',
    'This represents a significant increase of',
    'The key takeaway from this data is'
  ],
  'You are a skeptical CFO listening to a financial presentation. The presenter is showing you revenue trends. Ask clarifying questions about the data — things like "What was our growth rate compared to competitors?" or "How does this compare to our Q3 forecast?" Be analytical and demand precise answers. If numbers are unclear, ask for them to be explained.',
  20,
  false,
  120
),

(
  'presentation',
  3,
  'Handling Q&A Under Pressure',
  'Confidently manage tough questions from skeptical audiences. Learn diplomatic techniques to handle challenges while maintaining composure.',
  ARRAY[
    'That is an excellent question',
    'I am glad you raised that point',
    'Let me address that concern directly',
    'I would be happy to follow up with more details after the presentation'
  ],
  'You are an aggressive but fair board member asking tough questions after a strategic presentation. The presenter has just pitched a new market expansion initiative. Challenge them with questions like: "What is the ROI timeline?", "Have you considered the regulatory risks?", "Why should we invest here instead of doubling down on our core business?" Be persistent — do not accept vague answers.',
  35,
  true,
  130
),

(
  'presentation',
  4,
  'Persuasive Executive Pitch',
  'Craft and deliver a compelling argument to senior leadership. Use executive communication principles to present recommendations clearly.',
  ARRAY[
    'I recommend we proceed with this initiative because',
    'The business case is compelling for three reasons',
    'The risk is manageable and here is why',
    'I am asking for your approval to move forward with'
  ],
  'You are a Chief Operations Officer hearing a proposal to implement a new enterprise software system that will cost $2 million. The presenter needs to convince you it is worth the investment. Ask about implementation timeline, change management, expected ROI, and what happens if the project fails. You are cost-conscious but open to good arguments.',
  45,
  true,
  140
),

(
  'presentation',
  5,
  'International Conference Keynote',
  'Deliver authoritative keynote-style presentations to large international audiences. Master formal professional language, pacing, and global business communication.',
  ARRAY[
    'It is my privilege to address this distinguished gathering',
    'The global business landscape is undergoing a fundamental transformation',
    'The evidence suggests that organizations that embrace this shift will',
    'I would like to conclude by challenging each of you to'
  ],
  'You are a moderator at an international business conference where the speaker is delivering a keynote on digital transformation in Asia Pacific markets. Engage as an active moderator — prompt them with "Could you expand on that for our international audience?", ask about specific regional differences, and manage time by asking them to summarize key points. The virtual audience includes 500 executives from 20 countries.',
  70,
  true,
  150
),

-- ============================================================
-- SMALL TALK (levels 1-5)
-- ============================================================

(
  'small_talk',
  1,
  'Meeting Someone New at Work',
  'Break the ice confidently when meeting new colleagues. Master natural small talk openers and show genuine interest in others.',
  ARRAY[
    'It is great to meet you',
    'How long have you been with the company',
    'What department are you in',
    'I am looking forward to working with you'
  ],
  'You are a friendly new colleague who just joined the marketing team. You are meeting the user for the first time in the break room. Be warm, curious, and conversational. Ask about their role, how long they have been at the company, and share a little about yourself when appropriate. Keep the conversation natural and flowing — this is a casual first meeting.',
  10,
  false,
  210
),

(
  'small_talk',
  2,
  'Networking at a Business Event',
  'Work a room with confidence. Learn professional networking phrases that create genuine connections without feeling forced or salesy.',
  ARRAY[
    'What brings you to this event',
    'That is a fascinating industry',
    'I would love to hear more about your work',
    'Perhaps we could connect on LinkedIn'
  ],
  'You are an experienced professional at an industry networking mixer. You have been in finance for 15 years. Engage naturally in small talk — share what you do, ask about the other person, find common ground, and be open to exchanging contact information. Simulate realistic networking conversation including comfortable silences, topic transitions, and natural conversation endings.',
  15,
  false,
  220
),

(
  'small_talk',
  3,
  'Small Talk with Senior Leadership',
  'Navigate conversations with executives and senior managers confidently. Learn to be appropriately professional while still being personable.',
  ARRAY[
    'I really enjoyed your presentation on',
    'I have been following the company direction with great interest',
    'I appreciate the opportunity to speak with you',
    'I have been working on a project that relates to'
  ],
  'You are the VP of Strategy at a large corporation, attending a company social event. A junior employee approaches you for conversation. Be approachable but professional — engage genuinely but maintain appropriate status dynamics. Ask about their projects and give brief, thoughtful responses about company direction. You are busy but willing to have a meaningful 3-4 minute conversation.',
  25,
  true,
  230
),

(
  'small_talk',
  4,
  'Client Dinner Conversation',
  'Build rapport with clients in social settings. Navigate business-related topics gracefully while maintaining the relaxed atmosphere of a dinner setting.',
  ARRAY[
    'I have heard wonderful things about this restaurant',
    'How are things going at your end',
    'We have been really pleased with how the partnership has developed',
    'Tell me more about your expansion plans'
  ],
  'You are a key client having dinner with an account manager. You manage procurement for a large retail company and represent significant revenue. Be cordial and enjoy the dinner, but you also have real business concerns — delivery timelines and pricing. Mix genuine personal conversation (family, travel, hobbies) with natural business discussion. Respond warmly to good conversation and politely to awkward ones.',
  35,
  true,
  240
),

(
  'small_talk',
  5,
  'Cross-Cultural Business Communication',
  'Navigate professional small talk across cultural boundaries. Master culturally sensitive phrases and demonstrate global business acumen.',
  ARRAY[
    'I have always been fascinated by your country culture',
    'I understand that business relationships are built on trust',
    'Please correct me if I am mistaken about',
    'I look forward to learning from your perspective'
  ],
  'You are a senior Japanese business executive meeting a Western business partner for the first time. You value respectful communication, careful listening, and building trust before discussing business. The conversation should feel formal but genuine. Guide the user to demonstrate cultural sensitivity — respond positively to respectful approaches and coolly to overly casual or pushy ones. Occasionally use Japanese business customs in conversation (business card etiquette, group harmony focus).',
  50,
  true,
  250
),

-- ============================================================
-- EMAIL (levels 1-5)
-- ============================================================

(
  'email',
  1,
  'Professional Email Basics',
  'Write clear, professional business emails. Learn proper greetings, structure, and sign-offs for everyday workplace communication.',
  ARRAY[
    'I am writing to follow up on',
    'Please find attached the document you requested',
    'I would appreciate your feedback by',
    'Thank you for your prompt response'
  ],
  'You are an email writing coach reviewing a business professional email they want to send to their manager. They will speak the email aloud to you. Give specific feedback on: tone (too formal/informal?), clarity, structure, and any missing elements. Be encouraging and provide 2-3 concrete improvements. Then ask them to revise one specific part of the email.',
  10,
  false,
  310
),

(
  'email',
  2,
  'Making Requests Professionally',
  'Request information, meetings, or help from colleagues and external contacts with the right level of politeness and clarity.',
  ARRAY[
    'I was wondering if you would be available to',
    'Could you please provide me with',
    'I would be grateful if you could',
    'At your earliest convenience, could you'
  ],
  'You are a busy department head who receives hundreds of emails weekly. A colleague will practice making a request via email. Judge their email on: does it get to the point quickly? Is it appropriately polite without being overly lengthy? Does it have a clear call to action? Respond as you would naturally — if the email is unclear, ask for clarification. If it is excellent, express that and accept the request.',
  15,
  false,
  320
),

(
  'email',
  3,
  'Handling Complaints and Apologies',
  'Respond to client complaints professionally and write effective apology emails. Maintain relationships while resolving difficult situations.',
  ARRAY[
    'I sincerely apologize for the inconvenience caused',
    'We take full responsibility for this issue',
    'To resolve this immediately, we will',
    'We are committed to ensuring this does not happen again'
  ],
  'You are an unhappy client who sent a complaint email about a delayed software delivery that caused your company to miss a client deadline. You are frustrated but professional. The user will practice composing and delivering an apology and resolution email. Judge whether their response: acknowledges the problem clearly, takes responsibility, offers a concrete solution, and maintains a professional tone. If their apology is insufficient, express continued frustration.',
  30,
  true,
  330
),

(
  'email',
  4,
  'Negotiating via Email',
  'Conduct effective business negotiations through written communication. Balance assertiveness with diplomacy in email exchanges.',
  ARRAY[
    'After careful consideration, our position is',
    'We believe a mutually beneficial arrangement would be',
    'We are prepared to offer',
    'We trust this proposal reflects our commitment to a long-term partnership'
  ],
  'You are a vendor negotiating contract renewal terms via email exchange. You want to increase prices by 15% due to rising costs, but you are open to negotiation. The user will practice negotiating via email. Respond realistically: reject unreasonable counteroffers, consider fair ones, and make counter-proposals. Use formal email language. The goal is to reach a mutually acceptable agreement within 3-4 email exchanges.',
  40,
  true,
  340
),

(
  'email',
  5,
  'Executive Communication and Memos',
  'Write concise, impactful executive-level communications. Master the art of conveying complex information clearly to C-suite audiences.',
  ARRAY[
    'This memo outlines our recommended course of action',
    'The key business implications are as follows',
    'I recommend we prioritize',
    'Your decision on this matter will determine'
  ],
  'You are a CEO receiving executive communications from your senior leadership team. The user will practice writing and delivering executive memos and communications. Evaluate them on: executive brevity (no unnecessary words), clear recommendation, supporting rationale, and risk acknowledgment. Ask penetrating questions: "What is the opportunity cost?", "What are the three scenarios?", "What decision do you need from me?" Be demanding but fair.',
  60,
  true,
  350
),

-- ============================================================
-- NEGOTIATION (levels 1-5)
-- ============================================================

(
  'negotiation',
  1,
  'Negotiation Fundamentals',
  'Learn the basic principles of win-win negotiation. Practice opening positions, making concessions, and reaching agreement.',
  ARRAY[
    'I would like to propose',
    'What are your main priorities in this negotiation',
    'I think we can find a solution that works for both of us',
    'Can we explore some alternatives'
  ],
  'You are a supplier negotiating the price of office furniture with a new client. Your opening price is $50,000 for a complete office setup. You have a floor of $40,000 but will not reveal it. Be realistic — make concessions slowly and only when you get something in return. Practice classic negotiation: anchor high, create value, make strategic concessions. Guide the user to practice basic negotiation language.',
  20,
  false,
  410
),

(
  'negotiation',
  2,
  'Handling Objections and Pushback',
  'Respond to resistance and objections with confidence. Turn "no" into "let me think about it" with professional negotiation language.',
  ARRAY[
    'I understand your concern, however',
    'Let me address that objection directly',
    'What would make this more acceptable to you',
    'I appreciate your position, and I believe we can find a way forward'
  ],
  'You are a potential client who is skeptical about purchasing a cloud software subscription. Your main objections are: the price is too high, you are unsure about switching costs, and you worry about data security. Raise these objections naturally as the salesperson attempts to negotiate. Be realistic — if they address your concerns well with facts and confidence, soften your position. If they are pushy or evasive, become more resistant.',
  25,
  false,
  420
),

(
  'negotiation',
  3,
  'Multi-Issue Negotiation',
  'Negotiate across multiple variables simultaneously — price, timeline, scope, and terms. Create value by trading across different dimensions.',
  ARRAY[
    'I propose a package deal where',
    'If you can accommodate us on the timeline, we can be flexible on price',
    'Let us look at the total value of this partnership',
    'I am willing to move on price if we can agree on'
  ],
  'You are negotiating a complex IT consulting services contract. Multiple issues are on the table: project fee ($200K), payment terms (net 30 vs net 60), IP ownership, and project timeline (3 months vs 4 months). Each issue has a different priority for you: fee is most important, then IP ownership, then timeline, then payment terms. Negotiate realistically — make trades across issues to create value. Do not give in on everything at once.',
  40,
  true,
  430
),

(
  'negotiation',
  4,
  'High-Stakes Contract Negotiation',
  'Navigate complex, high-value contract negotiations with large organizations. Use advanced tactics like BATNA, anchoring, and value creation.',
  ARRAY[
    'Our best alternative to reaching agreement here is',
    'Let me anchor our discussion with a specific proposal',
    'The value we bring to this partnership extends beyond the immediate contract',
    'I am prepared to walk away if we cannot reach a fair agreement'
  ],
  'You are the Chief Procurement Officer of a large retail chain negotiating an exclusive supply agreement with a consumer goods manufacturer. The deal is worth $10 million annually. You have two competing bids. Be a tough but fair negotiator — use your BATNA (competing bids) strategically, probe for their walk-away point, and look for creative value-adds (exclusivity, marketing support, extended warranties). This should feel like a real high-stakes negotiation.',
  55,
  true,
  440
),

(
  'negotiation',
  5,
  'Cross-Border M&A Discussion',
  'Navigate merger and acquisition preliminary discussions across cultural and business boundaries. Master the language of strategic deal-making.',
  ARRAY[
    'We believe the strategic rationale for this combination is compelling',
    'Our valuation methodology takes into account',
    'We propose a structure that aligns the interests of both parties',
    'The synergies we have identified amount to'
  ],
  'You are an investment banker representing a US technology company in preliminary acquisition discussions with a European software firm. The target company is valued at approximately 200 million euros. Discuss strategic fit, valuation methodology (revenue multiples, EBITDA), deal structure (stock vs cash), integration approach, and cultural considerations. Be sophisticated and use precise M&A language. Challenge vague statements and push for specifics on valuation and synergy assumptions.',
  80,
  true,
  450
);
