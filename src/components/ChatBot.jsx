import { useState, useRef, useEffect } from 'react';
import { MessageCircleIcon, XIcon, ChevronRightIcon } from './Icons';

/* ═══════════════════════════════════════════════════════════════
   ROLE-AWARE FAQ DATABASE
   ═══════════════════════════════════════════════════════════════ */
const faqDatabase = {
  payment: [
    { keywords: ['payment', 'pay', 'money', 'fee', 'fees', 'cost', 'price', 'rent', 'amount', 'how much'],
      answer: 'Payment is handled directly with the hostel owner. Once your booking is approved, coordinate with the owner for payment methods. Most hostels accept UPI, bank transfer, or cash.',
      suggestions: ['Payment methods', 'My dues', 'My bookings'] },
    { keywords: ['refund', 'cancel', 'cancellation', 'money back', 'return money'],
      answer: 'Refund policies vary by hostel. Generally:\n- 7+ days before check-in: Full refund\n- 3-7 days: 50% refund\n- Less than 3 days: No refund\n\nContact the hostel owner for their specific policy.',
      suggestions: ['Cancel booking', 'My bookings', 'Contact support'] },
    { keywords: ['deposit', 'security', 'advance', 'caution'],
      answer: 'Yes, most hostels require a security deposit (typically 1-2 months rent). This is refundable when you check out, minus any damages.',
      suggestions: ['Payment methods', 'Check out process', 'My bookings'] },
    { keywords: ['due', 'deadline', 'when pay', 'payment date', 'rent due'],
      answer: 'Rent is typically due at the beginning of each month (1st-5th). Late payment may incur penalties. Check with your hostel owner for specifics.',
      suggestions: ['My dues', 'Late fee', 'Payment methods'] },
    { keywords: ['receipt', 'invoice', 'bill', 'proof'],
      answer: 'Request payment receipts directly from your hostel owner. They should provide receipts for all payments including rent, deposits, and additional charges.',
      suggestions: ['My dues', 'Contact owner', 'Payment info'] },
    { keywords: ['my dues', 'my payment', 'pending payment', 'what i owe', 'my rent'],
      answer: 'Let me check your payment status...', intent: 'my_dues' },
    { keywords: ['payment method', 'upi', 'bank transfer', 'cash', 'online payment', 'gpay', 'paytm', 'phonepe'],
      answer: 'Most hostels accept:\n- UPI (GPay, PhonePe, Paytm)\n- Bank Transfer (NEFT/IMPS)\n- Cash\n- Cheque (some hostels)\n\nConfirm accepted methods with your specific hostel owner.',
      suggestions: ['My dues', 'My bookings', 'Contact owner'] },
    { keywords: ['late fee', 'penalty', 'late payment'],
      answer: 'Late payment policies vary but typically:\n- 1-7 days late: Rs.100-500 fine\n- 7+ days: Higher penalty + warning\n- Repeated delays: Risk of eviction\n\nAlways pay on time or inform the owner in advance.',
      suggestions: ['Payment methods', 'My dues', 'Contact owner'] },
  ],

  booking: [
    { keywords: ['book', 'booking', 'reserve', 'reservation', 'how to book', 'make booking'],
      answer: 'To book a hostel:\n1. Search for hostels in your area\n2. View hostel details and rooms\n3. Click "Book Now" on your preferred room\n4. Fill booking details\n5. Wait for owner approval\n\nYou\'ll get notified once approved!',
      suggestions: ['Find hostels', 'Room types', 'My bookings'] },
    { keywords: ['my booking', 'my bookings', 'booking history', 'past booking', 'show booking'],
      answer: 'Let me fetch your bookings...', intent: 'my_bookings' },
    { keywords: ['status', 'pending', 'approved', 'rejected', 'booking status', 'check status'],
      answer: 'Checking your booking status...', intent: 'my_booking_status' },
    { keywords: ['cancel booking', 'cancel reservation', 'cancel my'],
      answer: 'To cancel a booking:\n1. Go to Dashboard -> My Bookings\n2. Find the booking you want to cancel\n3. Click "Cancel Booking"\n4. Confirm cancellation\n\nNote: Refund depends on the hostel\'s cancellation policy.',
      suggestions: ['My bookings', 'Refund policy', 'Contact owner'] },
    { keywords: ['check in', 'checkin', 'check-in', 'move in', 'when move'],
      answer: 'Check-in process:\n1. Get booking approved\n2. Contact hostel owner for date/time\n3. Bring ID proof (Aadhar/College ID)\n4. Pay security deposit\n5. Collect room keys\n\nTypical check-in time: 10 AM - 6 PM',
      suggestions: ['My booking status', 'Payment info', 'Contact owner'] },
    { keywords: ['check out', 'checkout', 'check-out', 'move out', 'leave', 'vacate'],
      answer: 'Check-out process:\n1. Inform owner 15-30 days in advance\n2. Clear all pending dues\n3. Clean and vacate room\n4. Return keys\n5. Room inspection by owner\n6. Get security deposit refund\n\nTypical check-out time: By 12 PM',
      suggestions: ['My dues', 'Refund policy', 'My bookings'] },
    { keywords: ['waiting', 'how long', 'approval time', 'when approve'],
      answer: 'Booking approval typically takes 24-48 hours. If you don\'t hear back within 2 days, contact the hostel owner directly through their contact details.',
      suggestions: ['My booking status', 'Contact owner', 'Find hostels'] },
  ],

  room: [
    { keywords: ['room type', 'sharing', 'types of room', 'room options'],
      answer: 'Let me show you room types...', intent: 'room_types' },
    { keywords: ['amenities', 'facilities', 'wifi', 'ac', 'food', 'mess', 'what included'],
      answer: 'Common hostel amenities:\n- WiFi\n- Study table & chair\n- Cupboard/storage\n- Attached/Common bathroom\n- 24/7 water & electricity\n\nPremium amenities (some hostels):\n- AC rooms\n- Mess/food\n- Laundry\n- Gym\n\nCheck individual hostel pages for details.',
      suggestions: ['Find hostels', 'Room types', 'Top rated'] },
    { keywords: ['change room', 'switch room', 'different room', 'upgrade'],
      answer: 'Room changes depend on availability and hostel policy. Contact your hostel owner to request a change. Note: changes may not be possible during peak seasons.',
      suggestions: ['My bookings', 'Contact owner', 'Room types'] },
    { keywords: ['available room', 'vacancy', 'room available', 'any room'],
      answer: 'Let me check current availability...', intent: 'available_rooms' },
    { keywords: ['furniture', 'bed', 'mattress', 'fan'],
      answer: 'Standard room furniture:\n- Bed with mattress\n- Study table\n- Chair\n- Cupboard/wardrobe\n- Lights & fan\n- Power outlets\n\nSome rooms may have AC, attached bathroom, or balcony.',
      suggestions: ['Room types', 'Amenities', 'Find hostels'] },
  ],

  hostel: [
    { keywords: ['how many hostel', 'total hostel', 'hostel count'],
      answer: 'Checking our database...', intent: 'hostel_count' },
    { keywords: ['hostel in', 'hostel near', 'find hostel', 'search hostel', 'looking for hostel'],
      answer: 'Let me search for hostels...', intent: 'hostels_in_city' },
    { keywords: ['cheap', 'affordable', 'budget', 'low price', 'cheapest'],
      answer: 'Finding affordable options...', intent: 'cheapest_hostels' },
    { keywords: ['best', 'top rated', 'highest rated', 'good hostel', 'recommended'],
      answer: 'Finding top-rated hostels...', intent: 'top_rated_hostels' },
    { keywords: ['boys hostel', 'girls hostel', 'male', 'female', 'men', 'women', 'ladies'],
      answer: 'Yes! We have:\n- Boys/Men\'s hostels\n- Girls/Women\'s hostels\n- Co-ed hostels (separate floors)\n\nUse the filter on search page to find hostels for your preference.',
      suggestions: ['Find hostels', 'Room types', 'Top rated'] },
    { keywords: ['near college', 'near university', 'student hostel'],
      answer: 'Many hostels are near popular colleges. When searching:\n1. Enter your college area in search\n2. Use distance feature to see proximity\n3. Filter by price and amenities\n\nSearch results show distance from your location!',
      suggestions: ['Find hostels', 'Cheapest hostels', 'Top rated'] },
  ],

  // OWNER-SPECIFIC
  owner: [
    { keywords: ['my rooms', 'owner rooms', 'room summary', 'room status'],
      answer: 'Fetching your room data...', intent: 'owner_rooms', ownerOnly: true },
    { keywords: ['owner booking', 'hostel booking', 'bookings in my', 'student booking'],
      answer: 'Fetching your bookings...', intent: 'owner_bookings', ownerOnly: true },
    { keywords: ['revenue', 'income', 'earning', 'how much earned', 'total revenue'],
      answer: 'Calculating revenue...', intent: 'owner_revenue', ownerOnly: true },
    { keywords: ['complaint', 'complaints', 'student complaint', 'issue reported'],
      answer: 'Fetching complaints...', intent: 'owner_complaints', ownerOnly: true },
    { keywords: ['add room', 'create room', 'new room'],
      answer: 'To add rooms:\n1. Go to Dashboard -> Rooms\n2. Rooms are auto-created based on your hostel configuration\n3. To change room configuration, edit your hostel\n\nYou can also manage individual room details from the Rooms page.',
      suggestions: ['My rooms', 'Owner bookings', 'Revenue'] },
    { keywords: ['owner available', 'vacant room', 'empty room'],
      answer: 'Checking available rooms...', intent: 'owner_available_rooms', ownerOnly: true },
  ],

  account: [
    { keywords: ['register', 'sign up', 'create account', 'new account', 'join', 'how to register'],
      answer: 'To create an account:\n1. Click "Register" on homepage\n2. Select "Student" or "Owner"\n3. Enter your details (name, email, phone, password)\n4. Click Register\n\nYou can then search and book hostels!',
      suggestions: ['How to book', 'Find hostels', 'Platform info'] },
    { keywords: ['password', 'forgot password', 'reset password', 'change password'],
      answer: 'To reset your password:\n1. Go to Login page\n2. Click "Forgot Password"\n3. Enter your registered email\n4. Check email for reset link\n5. Create a new password',
      suggestions: ['Login help', 'Contact support'] },
    { keywords: ['profile', 'update profile', 'edit profile', 'my profile'],
      answer: 'To update your profile:\n1. Login to your account\n2. Go to Dashboard\n3. Click on Profile\n4. Edit your details\n5. Click "Save Changes"',
      suggestions: ['My bookings', 'Payment info'] },
    { keywords: ['login', 'log in', 'sign in', 'cant login', 'login problem'],
      answer: 'If you\'re having login issues:\n1. Check if email is correct\n2. Verify password (case-sensitive)\n3. Clear browser cache\n4. Try "Forgot Password"\n\nMake sure you\'re using the correct account type (Student/Owner).',
      suggestions: ['Reset password', 'How to register'] },
  ],

  safety: [
    { keywords: ['safe', 'safety', 'secure', 'security', 'cctv', 'guard'],
      answer: 'Safety measures at most hostels:\n- 24/7 security guard\n- CCTV surveillance\n- Secure entry gates\n- Emergency contacts\n- Fire safety equipment\n\nAlways visit in person before booking and check reviews!',
      suggestions: ['Find hostels', 'Top rated', 'Reviews'] },
    { keywords: ['rules', 'hostel rules', 'regulations', 'guidelines', 'policy'],
      answer: 'Common hostel rules:\n- No smoking/alcohol\n- Quiet hours (10 PM - 7 AM)\n- Entry timing restrictions\n- Keep room & common areas clean\n- Carry ID always\n- Visitor restrictions\n\nSpecific rules vary by hostel.',
      suggestions: ['Amenities', 'Find hostels', 'How to book'] },
    { keywords: ['complaint', 'issue', 'problem', 'report', 'harassment'],
      answer: 'To report an issue:\n1. Contact hostel owner directly first\n2. If unresolved, use our complaint system from your dashboard\n3. For emergencies, call local authorities\n\nWe take safety seriously and will investigate all reports.',
      suggestions: ['Contact support', 'My bookings', 'Safety info'] },
    { keywords: ['emergency', 'urgent', 'help', 'danger'],
      answer: 'In case of emergency:\n1. Call emergency services: 112\n2. Contact hostel security\n3. Inform hostel owner\n\nImportant numbers:\n- Police: 100\n- Fire: 101\n- Ambulance: 102\n- Women helpline: 1091',
      suggestions: ['Report issue', 'Contact support', 'Safety info'] },
  ],

  general: [
    { keywords: ['contact', 'support', 'help', 'customer service'],
      answer: 'Contact options:\n- Use this chatbot for quick answers\n- Email: support@hostelhub.com\n- For hostel-specific issues, contact the owner directly\n\nWe typically respond within 24 hours.',
      suggestions: ['My bookings', 'Find hostels', 'Platform info'] },
    { keywords: ['review', 'rating', 'feedback', 'rate hostel'],
      answer: 'To leave a review:\n1. You must have stayed at the hostel\n2. Go to the hostel page\n3. Scroll to Reviews section\n4. Click "Write Review"\n5. Rate (1-5 stars) and add comments\n\nHonest reviews help other students!',
      suggestions: ['My bookings', 'Top rated', 'Find hostels'] },
    { keywords: ['stats', 'statistics', 'platform info', 'about platform'],
      answer: 'Let me get the latest statistics...', intent: 'platform_stats' },
    { keywords: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'good afternoon'],
      answer: null, isGreeting: true },
    { keywords: ['thank', 'thanks', 'thank you', 'thx', 'ty'],
      answer: 'You\'re welcome! Is there anything else I can help you with?',
      suggestions: ['My bookings', 'Find hostels', 'Payment info'] },
    { keywords: ['bye', 'goodbye', 'see you', 'exit', 'close'],
      answer: 'Goodbye! Have a great day. Feel free to chat anytime you have questions.',
      suggestions: [] },
    { keywords: ['who are you', 'what are you', 'your name', 'chatbot'],
      answer: 'I\'m the HostelHub Assistant. I can help you with:\n- Finding and comparing hostels\n- Booking information\n- Payment queries\n- Room availability\n- Safety & rules\n\nAsk me anything!',
      suggestions: ['Find hostels', 'How to book', 'Room types'] },
  ]
};

/* ── Matching & Helpers ──────────────────────────────── */
function findBestMatch(userInput, userRole) {
  const input = userInput.toLowerCase().trim();
  let bestMatch = null;
  let maxScore = 0;

  for (const category of Object.values(faqDatabase)) {
    for (const faq of category) {
      // Skip owner-only intents if user is not owner
      if (faq.ownerOnly && userRole !== 'owner') continue;
      let score = 0;
      for (const kw of faq.keywords) {
        if (input.includes(kw.toLowerCase())) score += kw.length;
      }
      if (score > maxScore) {
        maxScore = score;
        bestMatch = faq;
      }
    }
  }
  return bestMatch;
}

function extractCity(query) {
  const patterns = [
    /hostel(?:s)? (?:in|near|at|around) ([a-zA-Z\s]+)/i,
    /(?:in|near|at|around) ([a-zA-Z\s]+) (?:hostel|area|city)/i,
    /find (?:hostel|hostels) ([a-zA-Z\s]+)/i
  ];
  for (const p of patterns) {
    const m = query.match(p);
    if (m) return m[1].trim();
  }
  return null;
}

function getRoleGreeting(role) {
  if (role === 'owner')
    return 'Hello! I\'m your HostelHub Assistant. I can help you manage your rooms, view bookings, track revenue, and handle complaints. What would you like to know?';
  if (role === 'student')
    return 'Hello! I\'m your HostelHub Assistant. I can help you find hostels, check bookings, payment info, and more. What would you like to know?';
  return 'Hello! I\'m your HostelHub Assistant. I can help you find hostels, compare prices, and learn about our platform. What would you like to know?';
}

function getRoleSuggestions(role) {
  if (role === 'owner') return [
    { label: 'My Rooms', query: 'Show my rooms' },
    { label: 'Bookings', query: 'Bookings in my hostel' },
    { label: 'Revenue', query: 'Show revenue' },
    { label: 'Complaints', query: 'Show complaints' },
    { label: 'Platform Stats', query: 'Platform info' },
  ];
  if (role === 'student') return [
    { label: 'My Bookings', query: 'Show my bookings' },
    { label: 'Find Hostels', query: 'How many hostels are there?' },
    { label: 'Payment Info', query: 'How do I pay?' },
    { label: 'Top Rated', query: 'Best hostels' },
    { label: 'Room Types', query: 'What room types are available?' },
  ];
  return [
    { label: 'Find Hostels', query: 'How many hostels are there?' },
    { label: 'Room Types', query: 'What room types are available?' },
    { label: 'How to Register', query: 'How to register' },
    { label: 'Top Rated', query: 'Best hostels' },
    { label: 'Platform Info', query: 'Platform info' },
  ];
}

/* ═══════════════════════════════════════════════════════════════
   CHATBOT COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function ChatBot() {
  const userRole = localStorage.getItem('userRole') || 'guest';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', text: getRoleGreeting(userRole), time: new Date(), suggestions: getRoleSuggestions(userRole).map(s => s.label) }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lastIntent, setLastIntent] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages]);

  const queryDatabase = async (intent, query = {}) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/chatbot/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
        body: JSON.stringify({ intent, query })
      });
      return await res.json();
    } catch {
      return { success: false, message: 'Sorry, I couldn\'t fetch that information. Please try again.' };
    }
  };

  const formatDbResponse = (result, intent) => {
    if (!result.success && !result.message) return { text: 'Sorry, I encountered an error. Please try again.', suggestions: [] };
    let text = result.message;

    if (result.data) {
      switch (intent) {
        case 'my_bookings':
          if (Array.isArray(result.data)) {
            text += '\n\n';
            result.data.forEach((b, i) => {
              text += `${i + 1}. **${b.hostel}** — ${b.type || 'Room'}\n   Status: ${b.status} ${b.price ? `| Rs.${b.price}/month` : ''}\n\n`;
            });
          }
          break;
        case 'hostels_in_city': case 'cheapest_hostels': case 'top_rated_hostels':
          if (Array.isArray(result.data)) {
            text += '\n\n';
            result.data.forEach((h, i) => {
              text += `${i + 1}. **${h.name}** (${h.city})`;
              if (h.startingFrom) text += `\n   Starting Rs.${h.startingFrom}/month`;
              if (h.rating) text += `\n   Rating: ${h.rating}`;
              if (h.reviews) text += ` (${h.reviews} reviews)`;
              text += '\n\n';
            });
          }
          break;
        case 'available_rooms':
          if (Array.isArray(result.data)) {
            text += '\n\n';
            result.data.forEach(r => { text += `- **${r.type}**: ${r.availableRooms} rooms (avg Rs.${r.avgPrice}/month)\n`; });
          }
          break;
        case 'owner_rooms':
          if (Array.isArray(result.data)) {
            text += '\n\n';
            result.data.forEach(h => {
              text += `**${h.hostelName}**\n- Total: ${h.totalRooms} | Available: ${h.available} | Occupied: ${h.occupied}\n\n`;
            });
          }
          break;
        case 'owner_bookings':
          if (Array.isArray(result.data)) {
            text += '\n\n';
            result.data.forEach((b, i) => {
              text += `${i + 1}. **${b.student}** — ${b.roomType} at ${b.hostel}\n   Status: ${b.status}\n\n`;
            });
          }
          break;
        case 'owner_complaints':
          if (Array.isArray(result.data)) {
            text += '\n\n';
            result.data.forEach((c, i) => {
              text += `${i + 1}. **${c.student}**: "${c.comment}"\n   Rating: ${c.rating}/5\n\n`;
            });
          }
          break;
        case 'owner_available_rooms':
          if (Array.isArray(result.data)) {
            text += '\n\n';
            result.data.forEach(h => {
              text += `**${h.hostel}**\n`;
              h.rooms?.forEach(r => { text += `- Room ${r.number} (${r.type}) — ${r.beds} bed(s) free\n`; });
              text += '\n';
            });
          }
          break;
      }
    }
    return { text, suggestions: result.suggestions || [] };
  };

  const handleSend = async (text = inputValue) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { type: 'user', text: text.trim(), time: new Date() }]);
    setInputValue('');
    setIsTyping(true);

    const match = findBestMatch(text, userRole);
    let botMsg;

    if (match?.isGreeting) {
      botMsg = { type: 'bot', text: getRoleGreeting(userRole), time: new Date(), suggestions: getRoleSuggestions(userRole).map(s => s.label) };
    } else if (match?.intent) {
      const query = {};
      if (match.intent === 'hostels_in_city') query.city = extractCity(text);
      setLastIntent(match.intent);
      const result = await queryDatabase(match.intent, query);
      const formatted = formatDbResponse(result, match.intent);
      botMsg = { type: 'bot', text: formatted.text, time: new Date(), suggestions: formatted.suggestions };
    } else if (match) {
      setLastIntent(null);
      botMsg = { type: 'bot', text: match.answer, time: new Date(), suggestions: match.suggestions || [] };
    } else {
      const fallbackSuggestions = userRole === 'owner'
        ? ['My rooms', 'Bookings', 'Revenue', 'Complaints']
        : userRole === 'student'
          ? ['My bookings', 'Find hostels', 'Room types', 'Payment info']
          : ['Find hostels', 'Room types', 'How to register'];
      botMsg = { type: 'bot', text: 'I\'m not sure about that. Try one of the suggestions below, or ask about hostels, bookings, rooms, or payments.', time: new Date(), suggestions: fallbackSuggestions };
    }

    setTimeout(() => {
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 400 + Math.random() * 400);
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const formatTime = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const formatText = (t) => t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');

  const defaultSuggestions = getRoleSuggestions(userRole);

  return (
    <>
      <style>{chatStyles}</style>
      <div className="cb-container">
        {isOpen && (
          <div className="cb-window">
            {/* Header */}
            <div className="cb-header">
              <div className="cb-header-info">
                <div className="cb-avatar">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                </div>
                <div>
                  <div className="cb-name">HostelHub Assistant</div>
                  <div className="cb-status"><span className="cb-dot" /> Online</div>
                </div>
              </div>
              <button className="cb-close" onClick={() => setIsOpen(false)} aria-label="Close chat">
                <XIcon size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="cb-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`cb-msg cb-msg-${msg.type}`}>
                  <div className="cb-msg-bubble" dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} />
                  <div className="cb-msg-time">{formatTime(msg.time)}</div>
                  {/* Inline Suggestions */}
                  {msg.type === 'bot' && msg.suggestions?.length > 0 && (
                    <div className="cb-inline-suggestions">
                      {msg.suggestions.map((s, j) => (
                        <button key={j} className="cb-suggestion-chip" onClick={() => handleSend(s)}>
                          {s} <ChevronRightIcon size={12} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="cb-msg cb-msg-bot">
                  <div className="cb-typing">
                    <span /><span /><span />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="cb-quick-bar">
              {defaultSuggestions.slice(0, 4).map((s, i) => (
                <button key={i} className="cb-quick-btn" onClick={() => handleSend(s.query)}>{s.label}</button>
              ))}
            </div>

            {/* Input */}
            <div className="cb-input-area">
              <input
                type="text"
                className="cb-input"
                placeholder="Type your question..."
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button className="cb-send" onClick={() => handleSend()} disabled={!inputValue.trim() || isTyping} aria-label="Send">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* FAB Button */}
        <button className="cb-fab" onClick={() => setIsOpen(!isOpen)} aria-label="Open chat assistant">
          {!isOpen && <span className="cb-fab-pulse" />}
          {isOpen ? <XIcon size={22} /> : <MessageCircleIcon size={22} />}
        </button>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════════════ */
const chatStyles = `
  .cb-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999;
    font-family: var(--font-primary, 'Inter', system-ui, sans-serif);
  }

  /* ── FAB ────────────────────────────────── */
  .cb-fab {
    width: 56px; height: 56px;
    border-radius: var(--radius-full, 9999px);
    background: var(--primary, #2563eb);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 4px 20px rgba(37, 99, 235, 0.35);
    transition: all 0.2s var(--ease-default, ease);
    position: relative;
  }
  .cb-fab:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(37, 99, 235, 0.45); }

  .cb-fab-pulse {
    position: absolute; inset: 0;
    border-radius: inherit;
    background: var(--primary, #2563eb);
    opacity: 0.4;
    animation: cb-pulse 2s infinite;
  }
  @keyframes cb-pulse {
    0% { transform: scale(1); opacity: 0.4; }
    100% { transform: scale(1.6); opacity: 0; }
  }

  /* ── Window ────────────────────────────── */
  .cb-window {
    position: absolute;
    bottom: 70px; right: 0;
    width: 400px;
    height: 580px;
    background: var(--bg, #fff);
    border-radius: var(--radius-xl, 16px);
    box-shadow: 0 12px 48px rgba(0,0,0,0.15);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid var(--border, #e2e8f0);
    animation: cb-slide 0.25s var(--ease-out, ease);
  }
  @keyframes cb-slide {
    from { opacity: 0; transform: translateY(16px) scale(0.96); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* ── Header ────────────────────────────── */
  .cb-header {
    background: var(--primary, #2563eb);
    color: white;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }
  .cb-header-info { display: flex; align-items: center; gap: 12px; }
  .cb-avatar {
    width: 40px; height: 40px;
    background: rgba(255,255,255,0.18);
    border-radius: var(--radius-full, 50%);
    display: flex; align-items: center; justify-content: center;
  }
  .cb-name { font-weight: 600; font-size: 15px; }
  .cb-status { font-size: 12px; opacity: 0.85; display: flex; align-items: center; gap: 6px; }
  .cb-dot {
    width: 7px; height: 7px;
    background: #22c55e;
    border-radius: 50%;
    display: inline-block;
    animation: cb-blink 2s infinite;
  }
  @keyframes cb-blink { 50% { opacity: 0.4; } }
  .cb-close {
    background: rgba(255,255,255,0.15);
    border: none; color: white;
    width: 32px; height: 32px;
    border-radius: var(--radius-full, 50%);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.2s;
  }
  .cb-close:hover { background: rgba(255,255,255,0.25); }

  /* ── Messages ──────────────────────────── */
  .cb-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: var(--bg-secondary, #f8fafc);
  }
  .cb-messages::-webkit-scrollbar { width: 4px; }
  .cb-messages::-webkit-scrollbar-thumb { background: var(--border, #e2e8f0); border-radius: 9999px; }

  .cb-msg { max-width: 88%; animation: cb-in 0.25s ease; }
  @keyframes cb-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

  .cb-msg-bot { align-self: flex-start; }
  .cb-msg-user { align-self: flex-end; }

  .cb-msg-bubble {
    padding: 10px 14px;
    border-radius: 14px;
    font-size: 13.5px;
    line-height: 1.55;
    word-wrap: break-word;
  }
  .cb-msg-bot .cb-msg-bubble {
    background: var(--bg, #fff);
    color: var(--text, #0f172a);
    border-bottom-left-radius: 4px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    border: 1px solid var(--border-light, #f1f5f9);
  }
  .cb-msg-user .cb-msg-bubble {
    background: var(--primary, #2563eb);
    color: white;
    border-bottom-right-radius: 4px;
  }
  .cb-msg-time {
    font-size: 10px;
    color: var(--text-muted, #94a3b8);
    margin-top: 4px;
    padding: 0 4px;
  }
  .cb-msg-user .cb-msg-time { text-align: right; }

  /* ── Inline Suggestions ────────────────── */
  .cb-inline-suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }
  .cb-suggestion-chip {
    padding: 5px 12px;
    background: var(--bg, #fff);
    border: 1px solid var(--border, #e2e8f0);
    border-radius: var(--radius-full, 9999px);
    font-size: 12px;
    font-weight: 500;
    color: var(--primary, #2563eb);
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
  }
  .cb-suggestion-chip:hover {
    background: var(--primary, #2563eb);
    color: white;
    border-color: transparent;
    transform: translateY(-1px);
  }

  /* ── Typing ────────────────────────────── */
  .cb-typing {
    display: flex; gap: 5px;
    padding: 12px 16px;
    background: var(--bg, #fff);
    border-radius: 14px;
    border-bottom-left-radius: 4px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    border: 1px solid var(--border-light, #f1f5f9);
  }
  .cb-typing span {
    width: 7px; height: 7px;
    background: var(--text-muted, #94a3b8);
    border-radius: 50%;
    animation: cb-bounce 1.4s infinite;
  }
  .cb-typing span:nth-child(2) { animation-delay: 0.16s; }
  .cb-typing span:nth-child(3) { animation-delay: 0.32s; }
  @keyframes cb-bounce {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-6px); }
  }

  /* ── Quick Bar ─────────────────────────── */
  .cb-quick-bar {
    padding: 10px 14px;
    display: flex;
    gap: 6px;
    flex-wrap: nowrap;
    overflow-x: auto;
    background: var(--bg, #fff);
    border-top: 1px solid var(--border-light, #f1f5f9);
    flex-shrink: 0;
  }
  .cb-quick-bar::-webkit-scrollbar { display: none; }
  .cb-quick-btn {
    padding: 6px 14px;
    background: var(--bg-tertiary, #f1f5f9);
    border: 1px solid var(--border, #e2e8f0);
    border-radius: var(--radius-full, 9999px);
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary, #64748b);
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .cb-quick-btn:hover {
    background: var(--primary, #2563eb);
    color: white;
    border-color: transparent;
  }

  /* ── Input ─────────────────────────────── */
  .cb-input-area {
    padding: 12px 14px;
    background: var(--bg, #fff);
    border-top: 1px solid var(--border, #e2e8f0);
    display: flex;
    gap: 8px;
    align-items: center;
    flex-shrink: 0;
  }
  .cb-input {
    flex: 1;
    padding: 10px 16px;
    border: 1.5px solid var(--border, #e2e8f0);
    border-radius: var(--radius-full, 9999px);
    font-size: 13.5px;
    background: var(--bg-secondary, #f8fafc);
    color: var(--text, #0f172a);
    outline: none;
    transition: border-color 0.2s;
    font-family: inherit;
  }
  .cb-input:focus { border-color: var(--primary, #2563eb); }
  .cb-input::placeholder { color: var(--text-muted, #94a3b8); }

  .cb-send {
    width: 40px; height: 40px;
    border-radius: var(--radius-full, 50%);
    background: var(--primary, #2563eb);
    border: none; color: white;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
    flex-shrink: 0;
  }
  .cb-send:hover:not(:disabled) { transform: scale(1.06); box-shadow: 0 3px 12px rgba(37,99,235,0.3); }
  .cb-send:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ── Responsive ────────────────────────── */
  @media (max-width: 480px) {
    .cb-container { bottom: 16px; right: 16px; }
    .cb-window { width: calc(100vw - 32px); height: 70vh; bottom: 68px; }
    .cb-fab { width: 50px; height: 50px; }
  }
`;
