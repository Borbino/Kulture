/**
 * Layout — Global wrapper: Navbar + main + Footer
 * Phase 7 · Kulture Design System
 */
import Navbar from './Navbar';
import Footer from './Footer';
import styles from './Layout.module.css';
import PropTypes from 'prop-types';

export default function Layout({ children }) {
  return (
    <div className={styles.wrapper}>
      <Navbar />
      <main className={styles.main} id="main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
}

Layout.propTypes = {
  children: PropTypes.node,
};
