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
      </div>
    </main>

    <Footer />
  </div>
);

export default LearningHome;
