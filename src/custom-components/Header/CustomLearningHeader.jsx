import React, { useContext } from 'react';
import { AppContext } from '@edx/frontend-platform/react';
import { getConfig } from '@edx/frontend-platform';
import { Dropdown } from '@openedx/paragon';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@openedx/paragon';
import './CustomLearningHeader.scss';

const CustomLearningHeader = () => {
  const navigate = useNavigate();
  const { authenticatedUser } = useContext(AppContext);

  const navigationItems = [
    {
      name: 'Speaking',
      items: [
        { label: 'Read Aloud', path: '/speaking/read-aloud' },
        { label: 'Repeat Sentence', path: '/speaking/repeat-sentence' },
        { label: 'Describe Image', path: '/speaking/describe-image' },
      ],
    },
    {
      name: 'Writing',
      items: [
        { label: 'Summarize Written Text', path: '/writing/summarize-text' },
        { label: 'Write Essay', path: '/writing/essay' },
      ],
    },
    {
      name: 'Reading',
      items: [
        { label: 'Multiple Choice', path: '/reading/multiple-choice' },
        { label: 'Reorder Paragraphs', path: '/reading/reorder-paragraphs' },
        { label: 'Fill in the Blanks', path: '/reading/fill-blanks' },
      ],
    },
    {
      name: 'Listening',
      items: [
        { label: 'Summarize Spoken Text', path: '/listening/summarize' },
        { label: 'Multiple Choice', path: '/listening/multiple-choice' },
        { label: 'Fill in the Blanks', path: '/listening/fill-blanks' },
      ],
    },
  ];

  return (
    <header className="custom-header">
      <div className="container-xl py-2 d-flex align-items-center">
        {/* Logo */}
        <a className="logo" href="/dashboard">
          <img src={getConfig().LOGO_URL} alt={getConfig().SITE_NAME} height="30" />
        </a>

        {/* Navigation Menu */}
        <nav className="nav-menu flex-grow-1">
          {navigationItems.map((section) => (
            <Dropdown key={section.name} className="nav-item">
              <Dropdown.Toggle variant="link" id={`dropdown-${section.name.toLowerCase()}`}>
                {section.name}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {section.items.map((item) => (
                  <Dropdown.Item
                    key={item.path}
                    onClick={() => navigate(item.path)}
                  >
                    {item.label}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          ))}
          <a href="/test" className="nav-link">Test</a>
        </nav>

        {/* Right Side Menu */}
        <div className="header-actions d-flex align-items-center">
          <a href="/help" className="nav-link mr-3">Help</a>
          
          {authenticatedUser ? (
            <Dropdown className="user-dropdown">
              <Dropdown.Toggle variant="link" id="user-dropdown">
                <Avatar
                  size="sm"
                  src={authenticatedUser.profileImage}
                  alt={authenticatedUser.username}
                />
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item href="/dashboard">Dashboard</Dropdown.Item>
                <Dropdown.Item href="/profile">Profile</Dropdown.Item>
                <Dropdown.Item href="/account/settings">Account</Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item href="/logout">Sign Out</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          ) : (
            <div className="auth-buttons">
              <a href="/login" className="btn btn-link">Sign In</a>
              <a href="/register" className="btn btn-outline-primary">Register</a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default CustomLearningHeader; 