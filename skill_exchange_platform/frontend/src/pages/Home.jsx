import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

/* ── Inline SVG icons (no external dependency) ── */
const Icon = ({ children, size = 24, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {children}
  </svg>
);

const ZapIcon = ({ size }) => (
  <Icon size={size}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </Icon>
);

const ArrowRightIcon = ({ size }) => (
  <Icon size={size}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </Icon>
);

const BookIcon = ({ size }) => (
  <Icon size={size}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </Icon>
);

const UsersIcon = ({ size }) => (
  <Icon size={size}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Icon>
);

const HeartIcon = ({ size }) => (
  <Icon size={size}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </Icon>
);

const AwardIcon = ({ size }) => (
  <Icon size={size}>
    <circle cx="12" cy="8" r="7" />
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
  </Icon>
);

const UserIcon = ({ size }) => (
  <Icon size={size}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Icon>
);

const SearchIcon = ({ size }) => (
  <Icon size={size}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </Icon>
);

const CalendarIcon = ({ size }) => (
  <Icon size={size}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </Icon>
);

/* ══════════════════════════════════════════════════════════════
   HOME PAGE — Hero · How It Works
   ══════════════════════════════════════════════════════════════ */
export default function Home() {
  const navigate = useNavigate();
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
  }, []);

  return (
    <div className="hp">
      {/* ──────────── Hero ──────────── */}
      <section className={`hp-hero ${animate ? 'hp-hero--visible' : ''}`}>
        <div className="hp-hero__content">
          <span className="hp-badge">
            <ZapIcon size={16} />
            Student-to-Student Learning Platform
          </span>

          <h1 className="hp-hero__title">
            Learn Skills.<br />
            Teach Skills.<br />
            <span className="hp-gradient">Grow Together.</span>
          </h1>

          <p className="hp-hero__desc">
            The first peer-to-peer learning platform that lets you exchange
            skills through barter or learn from verified mentors. No middlemen.
            Just students helping students.
          </p>

          <div className="hp-hero__cta">
            <button className="hp-btn hp-btn--primary" onClick={() => navigate('/skills')}>
              Start Learning
              <ArrowRightIcon size={20} />
            </button>
            <button className="hp-btn hp-btn--secondary" onClick={() => navigate('/profile')}>
              Teach a Skill
              <BookIcon size={20} />
            </button>
          </div>
        </div>

        <div className="hp-hero__visual">
          <div className="hp-float hp-float--1">
            <UsersIcon size={24} />
            <span>Peer Learning</span>
          </div>
          <div className="hp-float hp-float--2">
            <HeartIcon size={24} />
            <span>Barter System</span>
          </div>
          <div className="hp-float hp-float--3">
            <AwardIcon size={24} />
            <span>Expert Mentors</span>
          </div>
        </div>
      </section>

      {/* ──────────── How It Works ──────────── */}
      <section className="hp-how">
        <h2 className="hp-section__title">How SkillSwap Works</h2>
        <p className="hp-section__sub">Three simple steps to start your learning journey</p>

        <div className="hp-steps">
          <div className="hp-step">
            <div className="hp-step__num">1</div>
            <div className="hp-step__icon"><UserIcon size={32} /></div>
            <h3>Create Your Profile</h3>
            <p>
              List the skills you can teach and the skills you want to learn.
              Build your reputation through quality sessions.
            </p>
          </div>

          <div className="hp-step">
            <div className="hp-step__num">2</div>
            <div className="hp-step__icon"><SearchIcon size={32} /></div>
            <h3>Find Your Match</h3>
            <p>
              Our smart algorithm matches you with students who want what you
              teach and teach what you want.
            </p>
          </div>

          <div className="hp-step">
            <div className="hp-step__num">3</div>
            <div className="hp-step__icon"><CalendarIcon size={32} /></div>
            <h3>Schedule &amp; Learn</h3>
            <p>
              Book sessions, chat with your match, and start your skill exchange
              journey. Rate each other after completion.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
