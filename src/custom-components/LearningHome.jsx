import React, { useEffect, useState } from 'react';
import Header from './Header/src/learning-header/LearningHeader';
import Footer from './Footer';

const LearningHome = () => {
  const slides = [
    {
      title: 'BEST PRACTICE PLATFORM FOR PTE ACADEMIC',
      subtitle: 'HIGH SCORE GUARANTEED',
      cta: 'GET STARTED',
      image: '/assets/hero/001.png',
    },
    {
      title: 'REAL EXAM QUESTION BANK UPDATED MONTHLY',
      subtitle: 'TRAIN WITH AUTHENTIC CONTENT',
      cta: 'VIEW COURSES',
      image: '/assets/hero/005.png',
    },
    {
      title: 'UX-DRIVEN PRACTICE TOOLS FOR EVERY SKILL',
      subtitle: 'DESIGNED BY TOP UX PROGRAMMERS',
      cta: 'START PRACTICING',
      image: '/assets/hero/002.png',
    },
    {
      title: 'EXTENSIVE MATERIALS LIBRARY',
      subtitle: 'TEXTBOOKS · PRACTICE TESTS · SPEED MASTER',
      cta: 'BROWSE MATERIALS',
      image: '/assets/hero/007.png',
    },
  ];

  const heroBackground = '/assets/hero/45367.jpg';

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
      background: #fff;
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
  // Background image for testimonials (replace with your asset path if needed)
  const testimonialBackground = '/assets/hero/008.jpg';

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
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

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
        <section className="py-5 my-5">
          <div className="text-center mb-5">
            <h2 className="display-4 fw-bold mb-3">WHAT WE OFFER YOU</h2>
            <div className="mx-auto" style={{ width: '80px', height: '3px', backgroundColor: '#F24C4C' }}></div>
          </div>
          
          <div className="row mb-4">
            <div className="col-12">
              <p className="lead text-center text-muted">
                MANABI HUB offers you the biggest real exam question bank on the market. New questions and audios are updated regularly and fastest. Additionally, our tool's features and layouts are designed by top-notch UX programmers, particularly user-friendly and easy to use.
              </p>
            </div>
          </div>

          <div className="row g-4">
            {/* Feature 1 */}
            <div className="col-md-4 text-center">
              <div className="position-relative mb-4">
                <div 
                  className="mx-auto d-flex align-items-center justify-content-center"
                  style={{ 
                    width: '120px', 
                    height: '120px', 
                    backgroundColor: '#F24C4C', 
                    borderRadius: '50%',
                    position: 'relative'
                  }}
                >
                  <div 
                    className="position-absolute"
                    style={{
                      width: '80px',
                      height: '80px',
                      backgroundColor: '#F24C4C',
                      borderRadius: '50%',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
                      backgroundSize: '20px 20px'
                    }}
                  ></div>
                  <div 
                    className="position-relative"
                    style={{
                      width: '60px',
                      height: '60px',
                      backgroundColor: '#F24C4C',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      color: 'white'
                    }}
                  >
                    ✓✓✓
                  </div>
                </div>
              </div>
              <h4 className="fw-bold mb-3">Real Exam Questions</h4>
              <p className="text-muted">
                Real exams questions updated monthly, high chance to encounter in your upcoming exams.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="col-md-4 text-center">
              <div className="position-relative mb-4">
                <div 
                  className="mx-auto d-flex align-items-center justify-content-center"
                  style={{ 
                    width: '120px', 
                    height: '120px', 
                    backgroundColor: '#F24C4C', 
                    borderRadius: '50%',
                    position: 'relative'
                  }}
                >
                  <div 
                    className="position-absolute"
                    style={{
                      width: '80px',
                      height: '80px',
                      backgroundColor: '#F24C4C',
                      borderRadius: '50%',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
                      backgroundSize: '20px 20px'
                    }}
                  ></div>
                  <div 
                    className="position-relative"
                    style={{
                      width: '60px',
                      height: '60px',
                      backgroundColor: '#F24C4C',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      color: 'white'
                    }}
                  >
                    ⚙️
                  </div>
                </div>
              </div>
              <h4 className="fw-bold mb-3">Smart Interface</h4>
              <p className="text-muted">
                Smart and user-friendly interface, smooth and frictionless operation system guaranteed.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="col-md-4 text-center">
              <div className="position-relative mb-4">
                <div 
                  className="mx-auto d-flex align-items-center justify-content-center"
                  style={{ 
                    width: '120px', 
                    height: '120px', 
                    backgroundColor: '#F24C4C', 
                    borderRadius: '50%',
                    position: 'relative'
                  }}
                >
                  <div 
                    className="position-absolute"
                    style={{
                      width: '80px',
                      height: '80px',
                      backgroundColor: '#F24C4C',
                      borderRadius: '50%',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
                      backgroundSize: '20px 20px'
                    }}
                  ></div>
                  <div 
                    className="position-relative"
                    style={{
                      width: '60px',
                      height: '60px',
                      backgroundColor: '#F24C4C',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      color: 'white'
                    }}
                  >
                    👥
                  </div>
                </div>
              </div>
              <h4 className="fw-bold mb-3">Trusted Community</h4>
              <p className="text-muted">
                Trusted and used by more than 50,000 Japanese language learners.
              </p>
            </div>
          </div>
        </section>

        {/* People Say */}
        <section
          className="people-say"
          style={{
            backgroundImage: `url(${testimonialBackground})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: '70% auto',
            backgroundPosition: 'right top',
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

        {/* Course Features Section */}
        <section className="py-5 my-5 bg-light">
          <div className="container">
            <div className="text-center mb-5">
              <h2 className="display-4 fw-bold mb-3">COURSE FEATURES</h2>
              <div className="mx-auto" style={{ width: '80px', height: '3px', backgroundColor: '#F24C4C' }}></div>
            </div>

            <div className="row g-4">
              <div className="col-md-6 col-lg-3">
                <div className="text-center">
                  <div 
                    className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                    style={{ 
                      width: '80px', 
                      height: '80px', 
                      backgroundColor: '#F24C4C', 
                      borderRadius: '50%',
                      color: 'white',
                      fontSize: '2rem'
                    }}
                  >
                    📚
                  </div>
                  <h5 className="fw-bold">N5-N1 Levels</h5>
                  <p className="text-muted small">Complete coverage from beginner to advanced levels</p>
                </div>
              </div>

              <div className="col-md-6 col-lg-3">
                <div className="text-center">
                  <div 
                    className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                    style={{ 
                      width: '80px', 
                      height: '80px', 
                      backgroundColor: '#F24C4C', 
                      borderRadius: '50%',
                      color: 'white',
                      fontSize: '2rem'
                    }}
                  >
                    🎧
                  </div>
                  <h5 className="fw-bold">Audio Practice</h5>
                  <p className="text-muted small">High-quality audio for listening comprehension</p>
                </div>
              </div>

              <div className="col-md-6 col-lg-3">
                <div className="text-center">
                  <div 
                    className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                    style={{ 
                      width: '80px', 
                      height: '80px', 
                      backgroundColor: '#F24C4C', 
                      borderRadius: '50%',
                      color: 'white',
                      fontSize: '2rem'
                    }}
                  >
                    📝
                  </div>
                  <h5 className="fw-bold">Practice Tests</h5>
                  <p className="text-muted small">Simulated exams with real question patterns</p>
                </div>
              </div>

              <div className="col-md-6 col-lg-3">
                <div className="text-center">
                  <div 
                    className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                    style={{ 
                      width: '80px', 
                      height: '80px', 
                      backgroundColor: '#F24C4C', 
                      borderRadius: '50%',
                      color: 'white',
                      fontSize: '2rem'
                    }}
                  >
                    📊
                  </div>
                  <h5 className="fw-bold">Progress Tracking</h5>
                  <p className="text-muted small">Monitor your learning progress and improvement</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-5 my-5">
          <div className="container">
            <div className="text-center mb-5">
              <h2 className="display-4 fw-bold mb-3">WHAT STUDENTS SAY</h2>
              <div className="mx-auto" style={{ width: '80px', height: '3px', backgroundColor: '#F24C4C' }}></div>
            </div>

            <div className="row g-4">
              <div className="col-md-4">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body text-center p-4">
                    <div className="mb-3">
                      <span className="text-warning">★★★★★</span>
                    </div>
                    <p className="card-text text-muted mb-3">
                      "MANABI HUB helped me pass N2 on my first try! The practice questions are exactly like the real exam."
                    </p>
                    <h6 className="fw-bold mb-1">Nguyen Minh</h6>
                    <small className="text-muted">N2 Graduate</small>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body text-center p-4">
                    <div className="mb-3">
                      <span className="text-warning">★★★★★</span>
                    </div>
                    <p className="card-text text-muted mb-3">
                      "The audio quality is excellent and the interface is very user-friendly. Highly recommended!"
                    </p>
                    <h6 className="fw-bold mb-1">Tran Linh</h6>
                    <small className="text-muted">N3 Graduate</small>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body text-center p-4">
                    <div className="mb-3">
                      <span className="text-warning">★★★★★</span>
                    </div>
                    <p className="card-text text-muted mb-3">
                      "I love how the questions are updated regularly. It keeps the content fresh and relevant."
                    </p>
                    <h6 className="fw-bold mb-1">Le Hoang</h6>
                    <small className="text-muted">N1 Graduate</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Subscription Plans Section */}
        <section className="py-5 my-5 bg-light">
          <div className="container">
            <div className="text-center mb-5">
              <h2 className="display-4 fw-bold mb-3">SUBSCRIPTION PLANS</h2>
              <div className="mx-auto" style={{ width: '80px', height: '3px', backgroundColor: '#F24C4C' }}></div>
            </div>

            <div className="row g-4 justify-content-center">
              {/* Premium 1 - 1 Month */}
              <div className="col-lg-4 col-md-6">
                <div className="card h-100 border-0 shadow-sm position-relative">
                  <div className="card-body text-center p-4">
                    {/* User Image */}
                    <div className="mb-4">
                      <div 
                        className="mx-auto rounded"
                        style={{ 
                          width: '120px', 
                          height: '120px', 
                          backgroundColor: '#f8f9fa',
                          backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'35\' r=\'20\' fill=\'%23ddd\'/%3E%3Cpath d=\'M30 70 Q50 50 70 70 L70 90 L30 90 Z\' fill=\'%23ddd\'/%3E%3C/svg%3E")',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      ></div>
                    </div>

                    <h4 className="fw-bold mb-3">PREMIUM 1</h4>
                    
                    <div className="mb-4">
                      <span className="display-4 fw-bold text-dark">$35</span>
                      <span className="text-muted">/1mo</span>
                    </div>

                    <ul className="list-unstyled mb-4">
                      <li className="mb-2 d-flex align-items-center">
                        <span className="text-danger me-2">✓</span>
                        <span>Real exam questions, regular update</span>
                      </li>
                      <li className="mb-2 d-flex align-items-center">
                        <span className="text-danger me-2">✓</span>
                        <span>Real audio, regular update</span>
                      </li>
                      <li className="mb-2 d-flex align-items-center">
                        <span className="text-danger me-2">✓</span>
                        <span>Advanced recommended solutions</span>
                      </li>
                      <li className="mb-2 d-flex align-items-center">
                        <span className="text-danger me-2">✓</span>
                        <span>Premium user only features</span>
                      </li>
                    </ul>

                    <button className="btn btn-outline-dark btn-lg w-100">
                      SUBSCRIBE
                    </button>
                  </div>
                </div>
              </div>

              {/* Premium 3 - 3 Months (Highlighted) */}
              <div className="col-lg-4 col-md-6">
                <div className="card h-100 border-0 shadow-lg position-relative" style={{ transform: 'scale(1.05)' }}>
                  <div className="card-body text-center p-4">
                    {/* User Image */}
                    <div className="mb-4">
                      <div 
                        className="mx-auto rounded"
                        style={{ 
                          width: '120px', 
                          height: '120px', 
                          backgroundColor: '#F24C4C',
                          backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'35\' r=\'20\' fill=\'%23fff\'/%3E%3Cpath d=\'M30 70 Q50 50 70 70 L70 90 L30 90 Z\' fill=\'%23fff\'/%3E%3C/svg%3E")',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      ></div>
                    </div>

                    <h4 className="fw-bold mb-3">PREMIUM 3</h4>
                    
                    <div className="mb-4">
                      <span className="display-4 fw-bold text-danger">$55</span>
                      <span className="text-muted">/3mo</span>
                    </div>

                    <ul className="list-unstyled mb-4">
                      <li className="mb-2 d-flex align-items-center">
                        <span className="text-danger me-2">✓</span>
                        <span>Real exam questions, regular update</span>
                      </li>
                      <li className="mb-2 d-flex align-items-center">
                        <span className="text-danger me-2">✓</span>
                        <span>Real audio, regular update</span>
                      </li>
                      <li className="mb-2 d-flex align-items-center">
                        <span className="text-danger me-2">✓</span>
                        <span>Advanced recommended solutions</span>
                      </li>
                      <li className="mb-2 d-flex align-items-center">
                        <span className="text-danger me-2">✓</span>
                        <span>Premium user only features</span>
                      </li>
                    </ul>

                    <button className="btn btn-danger btn-lg w-100">
                      SUBSCRIBE
                    </button>
                  </div>
                </div>
              </div>

              {/* Premium 6 - 6 Months */}
              <div className="col-lg-4 col-md-6">
                <div className="card h-100 border-0 shadow-sm position-relative">
                  <div className="card-body text-center p-4">
                    {/* User Image */}
                    <div className="mb-4">
                      <div 
                        className="mx-auto rounded"
                        style={{ 
                          width: '120px', 
                          height: '120px', 
                          backgroundColor: '#f8f9fa',
                          backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'35\' r=\'20\' fill=\'%23ddd\'/%3E%3Cpath d=\'M30 70 Q50 50 70 70 L70 90 L30 90 Z\' fill=\'%23ddd\'/%3E%3C/svg%3E")',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      ></div>
                    </div>

                    <h4 className="fw-bold mb-3">PREMIUM 6</h4>
                    
                    <div className="mb-4">
                      <span className="display-4 fw-bold text-dark">$95</span>
                      <span className="text-muted">/6mo</span>
                    </div>

                    <ul className="list-unstyled mb-4">
                      <li className="mb-2 d-flex align-items-center">
                        <span className="text-danger me-2">✓</span>
                        <span>Real exam questions, regular update</span>
                      </li>
                      <li className="mb-2 d-flex align-items-center">
                        <span className="text-danger me-2">✓</span>
                        <span>Real audio, regular update</span>
                      </li>
                      <li className="mb-2 d-flex align-items-center">
                        <span className="text-danger me-2">✓</span>
                        <span>Advanced recommended solutions</span>
                      </li>
                      <li className="mb-2 d-flex align-items-center">
                        <span className="text-danger me-2">✓</span>
                        <span>Premium user only features</span>
                      </li>
                    </ul>

                    <button className="btn btn-outline-dark btn-lg w-100">
                      SUBSCRIBE
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
    </main>

    <Footer />
  </div>
);

};

export default LearningHome;
