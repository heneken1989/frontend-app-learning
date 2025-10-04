import React from 'react';
import Header from './Header/src/learning-header/LearningHeader';
import Footer from './Footer';

const LearningHome = () => (
  <div className="d-flex flex-column min-vh-100">
    <Header />

    <main className="flex-grow-1 py-4">
      <div className="container">
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
      </div>
    </main>

    <Footer />
  </div>
);

export default LearningHome;
