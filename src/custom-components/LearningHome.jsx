import React, { useEffect, useState } from 'react';
import Header from './Header/src/learning-header/LearningHeader';
import Footer from './Footer';

// Import images directly for webpack to handle
import hero001 from '../assets/hero/001.png';
import hero002 from '../assets/hero/002.png';
import hero005 from '../assets/hero/005.png';
import hero007 from '../assets/hero/007.png';
import heroBackground from '../assets/hero/45367.jpg';
import testimonialBg from '../assets/hero/008.jpg';
import wwo01 from '../assets/hero/wwo_01.png';
import wwo02 from '../assets/hero/wwo_02.png';
import wwo03 from '../assets/hero/wwo_03.png';

const LearningHome = () => {
  const slides = [
    {
      title: 'BEST PRACTICE PLATFORM FOR PTE ACADEMIC',
      subtitle: 'HIGH SCORE GUARANTEED',
      cta: 'GET STARTED',
      image: hero001,
    },
    {
      title: 'REAL EXAM QUESTION BANK UPDATED MONTHLY',
      subtitle: 'TRAIN WITH AUTHENTIC CONTENT',
      cta: 'VIEW COURSES',
      image: hero005,
    },
    {
      title: 'UX-DRIVEN PRACTICE TOOLS FOR EVERY SKILL',
      subtitle: 'DESIGNED BY TOP UX PROGRAMMERS',
      cta: 'START PRACTICING',
      image: hero002,
    },
    {
      title: 'EXTENSIVE MATERIALS LIBRARY',
      subtitle: 'TEXTBOOKS · PRACTICE TESTS · SPEED MASTER',
      cta: 'BROWSE MATERIALS',
      image: hero007,
    },
  ];

  const heroStyles = `
    .hero-slider {
      width: 100%;
      padding: 0 0 24px;
      background: url(${heroBackground});
      background-repeat: no-repeat;
      background-position: center;
      background-size: cover;
    }
    .hero-slider-inner {
      position: relative;
      overflow: hidden;
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
      min-height: 380px;
      background: transparent;
    }
    .hero-slide {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 32px;
      transition: transform 0.5s ease, opacity 0.5s ease;
      opacity: 0;
      padding: 0 24px;
      box-sizing: border-box;
    }
    .hero-slide.active {
      opacity: 1;
    }
    .hero-slide-image {
      flex: 1 1 50%;
      min-height: 360px;
      background-repeat: no-repeat;
      background-position: center;
      background-size: contain;
      mix-blend-mode: multiply;
      background-color: transparent;
      filter: drop-shadow(0 18px 32px rgba(0,0,0,0.12));
      background-color: transparent;
      transition: transform 0.6s ease, opacity 0.6s ease;
      opacity: 0;
      transform: translateX(40px);
    }
    .hero-slide.active .hero-slide-image {
      opacity: 1;
      transform: translateX(0);
      animation: fadeInUp 0.6s ease;
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .hero-slide-text {
      flex: 1 1 50%;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      gap: 12px;
      padding: 16px;
      color: #1f1f1f;
      text-shadow: 0 1px 2px rgba(255,255,255,0.6);
    }
    .hero-slide-text h2 {
      font-size: 28px;
      font-weight: 700;
      margin: 0;
    }
    .hero-slide-text p {
      font-size: 16px;
      margin: 0;
      color: #3a3a3a;
    }
    .hero-cta {
      background: #f24c4c;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 12px 20px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 6px 16px rgba(0,0,0,0.12);
    }
    .hero-cta:hover {
      background: #d63f3f;
      transform: translateY(-1px);
    }
    .hero-nav {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(0,0,0,0.08);
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      color: #f24c4c;
      font-size: 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justifyContent: center;
      transition: background 0.2s ease;
    }
    .hero-nav:hover {
      background: rgba(0,0,0,0.14);
    }
    .hero-nav-prev { left: 12px; }
    .hero-nav-next { right: 12px; }
    .hero-dots {
      position: absolute;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 8px;
    }
    .hero-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      border: none;
      background: #ddd;
      cursor: pointer;
      transition: background 0.2s ease, transform 0.2s ease;
    }
    .hero-dot.active {
      background: #f24c4c;
      transform: scale(1.1);
    }
    @media (max-width: 992px) {
      .hero-slide {
        flex-direction: column;
        justify-content: center;
        text-align: center;
      }
      .hero-slide-text {
        align-items: center;
      }
      .hero-nav {
        top: auto;
        bottom: 24px;
      }
    }
    @media (max-width: 576px) {
      .hero-slide-text h2 {
        font-size: 22px;
      }
      .hero-slide-text p {
        font-size: 14px;
      }
      .hero-slider-inner {
        min-height: 420px;
      }
    }

    /* People Say */
    .people-say {
      width: 100%;
      padding: 32px 0 48px;
      background: #E6F2FF;
    }
    .people-say-inner {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
      padding: 0 24px;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 32px;
    }
    .people-say-text {
      flex: 0 0 auto;
      max-width: 500px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;
    }
    .people-say-quote {
      display: none;
    }
    .people-say-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 600;
      color: #444;
    }
    .people-quote {
      position: relative;
      max-width: 480px;
      margin: 0 0 20px 0;
      padding: 20px 22px;
      font-size: 17px;
      line-height: 1.7;
      color: #333;
      background: rgba(255,255,255,0.85);
      border-radius: 12px;
      box-shadow: 0 10px 24px rgba(0,0,0,0.06);
    }
    .people-quote-text {
      margin: 0;
    }
    .quote-icon {
      position: absolute;
      color: #f24c4c;
      font-size: 42px;
      font-weight: 800;
      opacity: 0.8;
      line-height: 1;
    }
    .quote-icon.left {
      top: 6px;
      left: 10px;
    }
    .quote-icon.right {
      bottom: 4px;
      right: 6px;
      transform: rotate(180deg);
    }
    .people-avatar {
      display: none;
    }
    .people-say-image {
      flex: 1 1 40%;
      display: flex;
      justify-content: center;
    }
    .people-say-image img {
      max-width: 100%;
      height: auto;
      border-radius: 12px;
      object-fit: cover;
    }
    .people-nav {
      display: flex;
      gap: 10px;
      margin-top: 12px;
    }
    .people-nav button {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 1px solid #f24c4c;
      background: #fff;
      color: #f24c4c;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .people-nav button:hover {
      background: #f24c4c;
      color: #fff;
    }
    .people-dots {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }
    .people-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ddd;
      border: none;
      cursor: pointer;
    }
    .people-dot.active {
      background: #f24c4c;
    }
    @media (max-width: 992px) {
      .people-say-inner {
        flex-direction: column;
        text-align: left;
      }
      .people-say-text {
        align-items: flex-start;
        max-width: 100%;
      }
      .people-quote {
        max-width: 100%;
        margin: 0 0 20px 0;
      }
      .people-say-image {
        order: -1;
      }
      .people-nav {
        justify-content: flex-start;
      }
      .people-meta {
        justify-content: flex-start;
      }
    }
  `;

  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [selectedDurations, setSelectedDurations] = useState({
    section_access: '1',
    all_except_conversation: '1',
    mock_test: '1',
    comprehensive_sections: '1'
  });

  const testimonials = [
    {
      name: 'Abdul Rehman',
      role: 'Learner',
      quote: 'This is one of the best websites to practice for your PTE test to achieve your target. It gives the exact scoring where you stand. A good platform to practice and clear the doubts of PTE; it improves my speaking skills and makes me confident for actual test.',
      avatar: '/assets/testomonials/user_001.jpg',
    },
    {
      name: 'Helen Nguyen',
      role: 'PTE Candidate',
      quote: 'Awesome app for practice. Extensive real exam question bank and high-quality machine scoring aligned to Pearson. Helps identify weaknesses; highly recommended for Speaking, Reading, Listening.',
      avatar: '/assets/testomonials/user_002.jpg',
      image: 'https://pte.tools/assets/banner_002.png',
    },
    {
      name: 'Arpan Khati',
      role: 'Student',
      quote: 'Legit practice material with impressive AI testing. I improved speaking, reading, listening; great for aiming 79+. Saves time and helps focus on weak points.',
      avatar: '/assets/testomonials/user_003.jpg',
      image: 'https://pte.tools/assets/banner_0030.png',
    },
    {
      name: 'Imran Ahmed',
      role: 'Learner',
      quote: 'Started speaking practice here; lots of resources and helpful scoring tools. Immediate score response after speaking tasks; very helpful AI-based test platform.',
      avatar: '/assets/testomonials/user_004.jpg',
      image: 'https://pte.tools/assets/banner_001.png',
    },
    {
      name: 'Tran Huong Hoa',
      role: 'Learner',
      quote: 'Best platform, well-organized with great materials and up-to-date exams. Flexible to practice on different devices anytime.',
      avatar: '/assets/testomonials/user_005.jpg',
      image: 'https://pte.tools/assets/banner_002.png',
    },
    {
      name: 'Michael Shrestha',
      role: 'Learner',
      quote: 'Great tool with proper scoring. Easy to use, user friendly; improved my speaking and listening. Highly recommend for self-practice PTE prep.',
      avatar: '/assets/testomonials/user_006.jpg',
      image: 'https://pte.tools/assets/banner_0030.png',
    },
    {
      name: 'Bianca Ng',
      role: 'Learner',
      quote: 'Amazing website covering nearly 80% real exam tasks. If you want to nail the test fast, PTE.tools is for you. Highly recommended.',
      avatar: '/assets/testomonials/user_007.jpg',
      image: 'https://pte.tools/assets/banner_001.png',
    },
    {
      name: 'Trinh Hồ',
      role: 'Learner',
      quote: 'Powerful tool with valuable data from real exams of PTE. Assisted me to reach target scores; after 2 months my Reading, Speaking, Listening passed Superior level.',
      avatar: '/assets/testomonials/user_008.jpg',
      image: 'https://pte.tools/assets/banner_002.png',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const goToSlide = (index) => {
    setActiveSlide((index + slides.length) % slides.length);
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />

      <main className="flex-grow-1 pt-0 pb-4">
        <section className="hero-slider">
          <div className="hero-slider-inner">
            {slides.map((slide, index) => (
              <div
                key={slide.title}
                className={`hero-slide ${index === activeSlide ? 'active' : ''}`}
                style={{ transform: `translateX(${(index - activeSlide) * 100}%)` }}
              >
            <div
              className="hero-slide-image"
              style={{ backgroundImage: `url(${slide.image})` }}
              aria-label={slide.title}
              role="img"
            />
                <div className="hero-slide-text">
                  <h2>{slide.title}</h2>
                  <p>{slide.subtitle}</p>
                  <button type="button" className="hero-cta">
                    {slide.cta}
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="hero-nav hero-nav-prev"
              onClick={() => goToSlide(activeSlide - 1)}
              aria-label="Previous slide"
            >
              ‹
            </button>
            <button
              type="button"
              className="hero-nav hero-nav-next"
              onClick={() => goToSlide(activeSlide + 1)}
              aria-label="Next slide"
            >
              ›
            </button>
            <div className="hero-dots">
              {slides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={`hero-dot ${index === activeSlide ? 'active' : ''}`}
                  onClick={() => goToSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </section>
        <style dangerouslySetInnerHTML={{ __html: heroStyles }} />

        <div className="container">
        <div className="d-flex flex-column align-items-center">
        <div className="w-100" style={{ maxWidth: '960px' }}>
        {/* Content Header */}
        <div className="d-flex align-items-center mb-4">
          <div
            className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: '45px', height: '45px', minWidth: '45px' }}
          >
            <span className="fs-4 fw-bold">02</span>
          </div>
          <h1 className="mb-0 ms-3 fs-2">試験科目と問題の構成</h1>
        </div>

        {/* 2025年 実施日 Section */}
        <section className="mb-4">
          <h2 className="border-bottom pb-2 mb-3">
            <span className="text-danger me-2">✚</span>
            2025年 実施日
          </h2>
          <div className="ps-4">
            <p className="mb-2">第1回 7月6日(日)</p>
            <p className="mb-2">第2回 12月7日(日)</p>
          </div>
        </section>

        {/* 試験科目と試験時間 Section */}
        <section>
          <h2 className="border-bottom pb-2 mb-3">
            <span className="text-danger me-2">✚</span>
            試験科目と試験時間
          </h2>
          <div className="table-responsive">
            <table className="table table-bordered">
              <thead>
                <tr className="bg-danger bg-opacity-10">
                  <th className="align-middle text-center" style={{ width: '80px' }}>レベル</th>
                  <th colSpan="2" className="text-center">試験科目・試験時間</th>
                  <th className="text-center" style={{ width: '120px' }}>聴解</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="bg-danger bg-opacity-10 text-center">N1</td>
                  <td colSpan="2" className="align-middle">
                      言語知識（文字・語彙・文法）・読解 〈110分〉
                      <div className="text-danger small">試験時間の変更はありません。</div>
                    </td>
                  <td className="text-center align-middle">聴解 〈55分〉</td>
                </tr>
                <tr>
                  <td className="bg-danger bg-opacity-10 text-center">N2</td>
                  <td colSpan="2" className="align-middle">言語知識（文字・語彙・文法）・読解 〈105分〉</td>
                  <td className="text-center align-middle">聴解 〈50分〉</td>
                </tr>
                <tr>
                  <td className="bg-danger bg-opacity-10 text-center">N3</td>
                  <td className="align-middle">言語知識（文字・語彙・文法）〈30分〉</td>
                  <td className="align-middle">言語知識（文法）・読解 〈70分〉</td>
                  <td className="text-center align-middle">聴解 〈40分〉</td>
                </tr>
                <tr>
                  <td className="bg-danger bg-opacity-10 text-center">N4</td>
                  <td className="align-middle">言語知識（文字・語彙・文法）〈25分〉</td>
                  <td className="align-middle">言語知識（文法）・読解 〈55分〉</td>
                  <td className="text-center align-middle">聴解 〈35分〉</td>
                </tr>
                <tr>
                  <td className="bg-danger bg-opacity-10 text-center">N5</td>
                  <td className="align-middle">言語知識（文字・語彙・文法）〈20分〉</td>
                  <td className="align-middle">言語知識（文法）・読解 〈40分〉</td>
                  <td className="text-center align-middle">聴解 〈30分〉</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="alert alert-info mt-3 py-2">
            <small>
              ※2022年第2回(12月)試験から〈55分〉になります。
            </small>
          </div>

          <div className="alert alert-secondary mt-3 py-2">
            <small>
              ※各市では、7月の試験だけ行う都市や、12月の試験だけ行う都市があります。こちらでご確認ください。
            </small>
          </div>
        </section>

        </div>
        </div>
        </div>

        {/* WHAT WE OFFER YOU Section */}
        <section className="py-5 my-5" id="services-section" style={{ backgroundColor: '#E6F2FF' }}>
          <div className="container">
            <div className="row justify-content-md-center">
              <div className="col-lg-10">
                <div className="text-center mb-5">
                  <h2 className="text-uppercase fw-bold mb-3" style={{ fontSize: '2rem' }}>What We Offer You</h2>
                  <p className="text-muted">
                    MANABI HUB provides comprehensive practice interfaces for each skill tab, offering unique advantages that help learners achieve their goals efficiently.
                  </p>
                </div>
              </div>
            </div>
            <div className="row g-4">
              <div className="col-lg-4 col-md-6">
                <div className="text-center mb-4">
                  <img 
                    src={wwo01} 
                    alt="Extensive Practice Materials" 
                    className="mb-3"
                    style={{ maxWidth: '120px', height: 'auto' }}
                  />
                  <h5 className="fw-bold mb-3">Extensive Practice Materials</h5>
                  <p className="text-muted">
                    Practice thousands of vocabulary words, kanji characters, grammar sentences, and reading comprehension exercises across all JLPT levels (N5 to N1).
                  </p>
                </div>
              </div>
              <div className="col-lg-4 col-md-6">
                <div className="text-center mb-4">
                  <img 
                    src={wwo02} 
                    alt="Unlimited Practice Time" 
                    className="mb-3"
                    style={{ maxWidth: '120px', height: 'auto' }}
                  />
                  <h5 className="fw-bold mb-3">Unlimited Practice Time</h5>
                  <p className="text-muted">
                    Practice for hours without restrictions. No daily access limits - study as much as you want, whenever you want.
                  </p>
                </div>
              </div>
              <div className="col-lg-4 col-md-6">
                <div className="text-center mb-4">
                  <img 
                    src={wwo03} 
                    alt="All Market Textbooks" 
                    className="mb-3"
                    style={{ maxWidth: '120px', height: 'auto' }}
                  />
                  <h5 className="fw-bold mb-3">All Market Textbooks</h5>
                  <p className="text-muted">
                    Access practice materials from all textbooks available on the market, all in one convenient platform.
                  </p>
                </div>
              </div>
              <div className="col-lg-4 col-md-6">
                <div className="text-center mb-4">
                  <div 
                    className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                    style={{ 
                      width: '120px', 
                      height: '120px', 
                      backgroundColor: '#F24C4C', 
                      borderRadius: '50%',
                      color: 'white',
                      fontSize: '3rem'
                    }}
                  >
                    💻
                  </div>
                  <h5 className="fw-bold mb-3">Study Anywhere, Anytime</h5>
                  <p className="text-muted">
                    Practice from anywhere at any time that suits you. No need to carry books or notebooks - just a laptop with internet connection is all you need.
                  </p>
                </div>
              </div>
              <div className="col-lg-4 col-md-6">
                <div className="text-center mb-4">
                  <div 
                    className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                    style={{ 
                      width: '120px', 
                      height: '120px', 
                      backgroundColor: '#F24C4C', 
                      borderRadius: '50%',
                      color: 'white',
                      fontSize: '3rem'
                    }}
                  >
                    🔁
                  </div>
                  <h5 className="fw-bold mb-3">Learn Through Repetition</h5>
                  <p className="text-muted">
                    No need to force memorization. Simply practice exercises multiple times and you'll naturally remember the content through repetition.
                  </p>
                </div>
              </div>
              <div className="col-lg-4 col-md-6">
                <div className="text-center mb-4">
                  <div 
                    className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                    style={{ 
                      width: '120px', 
                      height: '120px', 
                      backgroundColor: '#F24C4C', 
                      borderRadius: '50%',
                      color: 'white',
                      fontSize: '3rem'
                    }}
                  >
                    📝
                  </div>
                  <h5 className="fw-bold mb-3">Real JLPT Mock Tests</h5>
                  <p className="text-muted">
                    Multiple mock tests that simulate real JLPT exams, allowing you to practice and prepare effectively for quick success.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* People Say */}
        <section
          className="people-say"
          style={{
            backgroundImage: `url(${testimonialBg})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: '70% auto',
            backgroundPosition: 'right top',
            backgroundColor: '#E6F2FF',
          }}
        >
          <div className="people-say-inner">
            <div className="people-say-text">
              <h3 style={{ margin: 0, fontSize: '26px', fontWeight: 700, color: '#333' }}>PEOPLE SAID</h3>
              <div className="people-quote">
                <span className="quote-icon left">“</span>
                <p className="people-quote-text">{testimonials[activeTestimonial].quote}</p>
                <span className="quote-icon right">“</span>
              </div>
              <div className="people-say-meta">
                <img className="people-avatar" src={testimonials[activeTestimonial].avatar} alt={testimonials[activeTestimonial].name} />
                <div>
                  <div>{testimonials[activeTestimonial].name}</div>
                  <div style={{ color: '#777', fontWeight: 400, fontSize: '13px' }}>{testimonials[activeTestimonial].role}</div>
                </div>
              </div>
              <div className="people-nav">
                <button type="button" onClick={() => setActiveTestimonial((activeTestimonial - 1 + testimonials.length) % testimonials.length)} aria-label="Previous testimonial">‹</button>
                <button type="button" onClick={() => setActiveTestimonial((activeTestimonial + 1) % testimonials.length)} aria-label="Next testimonial">›</button>
              </div>
              <div className="people-dots">
                {testimonials.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`people-dot ${idx === activeTestimonial ? 'active' : ''}`}
                    onClick={() => setActiveTestimonial(idx)}
                    aria-label={`Go to testimonial ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Course Packages Section */}
        <section className="py-5 my-5" style={{ backgroundColor: '#E6F2FF' }}>
          <div className="container">
            <div className="text-center mb-5">
              <h2 className="display-4 fw-bold mb-3">COURSE PACKAGES</h2>
              <div className="mx-auto" style={{ width: '80px', height: '3px', backgroundColor: '#F24C4C' }}></div>
              <p className="text-muted mt-3">Choose the package that fits your learning goals</p>
            </div>

            <div className="row g-4">
              {/* Package 1: 読解 Section */}
              <div className="col-lg-6 col-md-6">
                <div className="card h-100 border-0 shadow-sm position-relative" style={{ overflow: 'hidden' }}>
                  <img 
                    src="https://pte.tools/assets/plan_01.png"
                    alt="Reading Section"
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '120px',
                      height: 'auto',
                      opacity: 0.8,
                      zIndex: 1,
                      pointerEvents: 'none'
                    }}
                  />
                  <div className="card-body p-4" style={{ position: 'relative', zIndex: 2 }}>
                    <div className="mb-3">
                      <span style={{ fontSize: '2.5rem' }}>📚</span>
                    </div>
                    <h4 className="fw-bold mb-2">Reading Section Package</h4>
                    <p className="text-muted small mb-3">Full access to the Reading section</p>
                    
                    <div className="mb-3">
                      <div className="d-flex gap-1 mb-2">
                        <div 
                          className={`flex-fill text-center p-1 border rounded ${selectedDurations.section_access === '1' ? 'bg-light border-danger' : ''}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedDurations({...selectedDurations, section_access: '1'})}
                        >
                          <div className="fw-bold text-danger" style={{ fontSize: '0.9rem' }}>2,000đ</div>
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>1 month</small>
                        </div>
                        <div 
                          className={`flex-fill text-center p-1 border rounded ${selectedDurations.section_access === '3' ? 'bg-light border-danger' : ''}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedDurations({...selectedDurations, section_access: '3'})}
                        >
                          <div className="fw-bold text-danger" style={{ fontSize: '0.9rem' }}>5,000đ</div>
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>3 months</small>
                          <div><span className="badge bg-success" style={{ fontSize: '0.6rem' }}>-17%</span></div>
                        </div>
                        <div 
                          className={`flex-fill text-center p-1 border rounded ${selectedDurations.section_access === '6' ? 'bg-light border-danger' : ''}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedDurations({...selectedDurations, section_access: '6'})}
                        >
                          <div className="fw-bold text-danger" style={{ fontSize: '0.9rem' }}>8,000đ</div>
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>6 months</small>
                          <div><span className="badge bg-success" style={{ fontSize: '0.6rem' }}>-33%</span></div>
                        </div>
                      </div>
                    </div>

                    <ul className="list-unstyled mb-4">
                      <li className="mb-2">
                        <span className="text-success me-2">✅</span>
                        <span>Full access to all units in Reading section</span>
                      </li>
                      <li className="mb-2">
                        <span className="text-success me-2">✅</span>
                        <span>Unlimited units</span>
                      </li>
                    </ul>

                    <a href={`/learning/subscription/checkout?package=section_access&duration=${selectedDurations.section_access}`} className="btn btn-danger w-100">
                      SUBSCRIBE NOW
                    </a>
                  </div>
                </div>
              </div>

              {/* Package 2: All Sections (Except Conversation) */}
              <div className="col-lg-6 col-md-6">
                <div className="card h-100 border-0 shadow-sm position-relative" style={{ overflow: 'hidden' }}>
                  <img 
                    src="https://pte.tools/assets/plan_02.png"
                    alt="All Sections"
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '120px',
                      height: 'auto',
                      opacity: 0.8,
                      zIndex: 1,
                      pointerEvents: 'none'
                    }}
                  />
                  <div className="card-body p-4" style={{ position: 'relative', zIndex: 2 }}>
                    <div className="mb-3">
                      <span style={{ fontSize: '2.5rem' }}>🎯</span>
                    </div>
                    <h4 className="fw-bold mb-2">All Sections (Except Conversation)</h4>
                    <p className="text-muted small mb-3">Access all sections except Conversation</p>
                    
                    <div className="mb-3">
                      <div className="d-flex gap-1 mb-2">
                        <div 
                          className={`flex-fill text-center p-1 border rounded ${selectedDurations.all_except_conversation === '1' ? 'bg-light border-danger' : ''}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedDurations({...selectedDurations, all_except_conversation: '1'})}
                        >
                          <div className="fw-bold text-danger" style={{ fontSize: '0.9rem' }}>2,000đ</div>
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>1 month</small>
                        </div>
                        <div 
                          className={`flex-fill text-center p-1 border rounded ${selectedDurations.all_except_conversation === '3' ? 'bg-light border-danger' : ''}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedDurations({...selectedDurations, all_except_conversation: '3'})}
                        >
                          <div className="fw-bold text-danger" style={{ fontSize: '0.9rem' }}>5,000đ</div>
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>3 months</small>
                          <div><span className="badge bg-success" style={{ fontSize: '0.6rem' }}>-17%</span></div>
                        </div>
                        <div 
                          className={`flex-fill text-center p-1 border rounded ${selectedDurations.all_except_conversation === '6' ? 'bg-light border-danger' : ''}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedDurations({...selectedDurations, all_except_conversation: '6'})}
                        >
                          <div className="fw-bold text-danger" style={{ fontSize: '0.9rem' }}>8,000đ</div>
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>6 months</small>
                          <div><span className="badge bg-success" style={{ fontSize: '0.6rem' }}>-33%</span></div>
                        </div>
                      </div>
                    </div>

                    <ul className="list-unstyled mb-4">
                      <li className="mb-2">
                        <span className="text-success me-2">✅</span>
                        <span>Access all sections except Conversation</span>
                      </li>
                      <li className="mb-2">
                        <span className="text-success me-2">✅</span>
                        <span>Unlimited units</span>
                      </li>
                    </ul>

                    <a href={`/learning/subscription/checkout?package=all_except_conversation&duration=${selectedDurations.all_except_conversation}`} className="btn btn-danger w-100">
                      SUBSCRIBE NOW
                    </a>
                  </div>
                </div>
              </div>

              {/* Package 3: Mock Test */}
              <div className="col-lg-6 col-md-6">
                <div className="card h-100 border-0 shadow-sm position-relative" style={{ overflow: 'hidden' }}>
                  <img 
                    src="https://pte.tools/assets/plan_03.png"
                    alt="Mock Test"
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '120px',
                      height: 'auto',
                      opacity: 0.8,
                      zIndex: 1,
                      pointerEvents: 'none'
                    }}
                  />
                  <div className="card-body p-4" style={{ position: 'relative', zIndex: 2 }}>
                    <div className="mb-3">
                      <span style={{ fontSize: '2.5rem' }}>📝</span>
                    </div>
                    <h4 className="fw-bold mb-2">Mock Test Package</h4>
                    <p className="text-muted small mb-3">Full access to the Mock Test section</p>
                    
                    <div className="mb-3">
                      <div className="d-flex gap-1 mb-2">
                        <div 
                          className={`flex-fill text-center p-1 border rounded ${selectedDurations.mock_test === '1' ? 'bg-light border-danger' : ''}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedDurations({...selectedDurations, mock_test: '1'})}
                        >
                          <div className="fw-bold text-danger" style={{ fontSize: '0.9rem' }}>2,000đ</div>
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>1 month</small>
                        </div>
                        <div 
                          className={`flex-fill text-center p-1 border rounded ${selectedDurations.mock_test === '3' ? 'bg-light border-danger' : ''}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedDurations({...selectedDurations, mock_test: '3'})}
                        >
                          <div className="fw-bold text-danger" style={{ fontSize: '0.9rem' }}>5,000đ</div>
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>3 months</small>
                          <div><span className="badge bg-success" style={{ fontSize: '0.6rem' }}>-17%</span></div>
                        </div>
                        <div 
                          className={`flex-fill text-center p-1 border rounded ${selectedDurations.mock_test === '6' ? 'bg-light border-danger' : ''}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedDurations({...selectedDurations, mock_test: '6'})}
                        >
                          <div className="fw-bold text-danger" style={{ fontSize: '0.9rem' }}>8,000đ</div>
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>6 months</small>
                          <div><span className="badge bg-success" style={{ fontSize: '0.6rem' }}>-33%</span></div>
                        </div>
                      </div>
                    </div>

                    <ul className="list-unstyled mb-4">
                      <li className="mb-2">
                        <span className="text-success me-2">✅</span>
                        <span>Full access to all units in Mock Test section</span>
                      </li>
                      <li className="mb-2">
                        <span className="text-success me-2">✅</span>
                        <span>Unlimited units</span>
                      </li>
                    </ul>

                    <a href={`/learning/subscription/checkout?package=mock_test&duration=${selectedDurations.mock_test}`} className="btn btn-danger w-100">
                      SUBSCRIBE NOW
                    </a>
                  </div>
                </div>
              </div>

              {/* Package 4: Comprehensive (Featured) */}
              <div className="col-lg-6 col-md-6">
                <div className="card h-100 border-0 shadow-lg position-relative" style={{ borderTop: '4px solid #F24C4C', overflow: 'hidden' }}>
                  <img 
                    src="https://pte.tools/assets/plan_03.png"
                    alt="Comprehensive Package"
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '120px',
                      height: 'auto',
                      opacity: 0.8,
                      zIndex: 1,
                      pointerEvents: 'none'
                    }}
                  />
                  <div className="position-absolute top-0 end-0 m-3" style={{ zIndex: 3 }}>
                    <span className="badge bg-danger">POPULAR</span>
                  </div>
                  <div className="card-body p-4" style={{ position: 'relative', zIndex: 2 }}>
                    <div className="mb-3">
                      <span style={{ fontSize: '2.5rem' }}>🌟</span>
                    </div>
                    <h4 className="fw-bold mb-2">Listening + Vocabulary/Kanji + Grammar + Reading</h4>
                    <p className="text-muted small mb-3">Full access to Listening, Vocabulary/Kanji, Grammar, and Reading sections</p>
                    
                    <div className="mb-3">
                      <div className="d-flex gap-1 mb-2">
                        <div 
                          className={`flex-fill text-center p-1 border rounded ${selectedDurations.comprehensive_sections === '1' ? 'bg-light border-danger' : ''}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedDurations({...selectedDurations, comprehensive_sections: '1'})}
                        >
                          <div className="fw-bold text-danger" style={{ fontSize: '0.9rem' }}>2,000đ</div>
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>1 month</small>
                        </div>
                        <div 
                          className={`flex-fill text-center p-1 border rounded ${selectedDurations.comprehensive_sections === '3' ? 'bg-light border-danger' : ''}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedDurations({...selectedDurations, comprehensive_sections: '3'})}
                        >
                          <div className="fw-bold text-danger" style={{ fontSize: '0.9rem' }}>5,000đ</div>
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>3 months</small>
                          <div><span className="badge bg-success" style={{ fontSize: '0.6rem' }}>-17%</span></div>
                        </div>
                        <div 
                          className={`flex-fill text-center p-1 border rounded ${selectedDurations.comprehensive_sections === '6' ? 'bg-light border-danger' : ''}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedDurations({...selectedDurations, comprehensive_sections: '6'})}
                        >
                          <div className="fw-bold text-danger" style={{ fontSize: '0.9rem' }}>8,000đ</div>
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>6 months</small>
                          <div><span className="badge bg-success" style={{ fontSize: '0.6rem' }}>-33%</span></div>
                        </div>
                      </div>
                    </div>

                    <ul className="list-unstyled mb-4">
                      <li className="mb-2">
                        <span className="text-success me-2">✅</span>
                        <span>Full access to Listening section</span>
                      </li>
                      <li className="mb-2">
                        <span className="text-success me-2">✅</span>
                        <span>Full access to Vocabulary/Kanji section</span>
                      </li>
                      <li className="mb-2">
                        <span className="text-success me-2">✅</span>
                        <span>Full access to Grammar section</span>
                      </li>
                      <li className="mb-2">
                        <span className="text-success me-2">✅</span>
                        <span>Full access to Reading section</span>
                      </li>
                      <li className="mb-2">
                        <span className="text-success me-2">✅</span>
                        <span>Unlimited units</span>
                      </li>
                    </ul>

                    <a href={`/learning/subscription/checkout?package=comprehensive_sections&duration=${selectedDurations.comprehensive_sections}`} className="btn btn-danger w-100">
                      SUBSCRIBE NOW
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-4">
              <a href="/learning/payment" className="btn btn-link text-danger">
                Xem chi tiết và thanh toán →
              </a>
            </div>
          </div>
        </section>
    </main>

    <Footer />
  </div>
);

};

export default LearningHome;
