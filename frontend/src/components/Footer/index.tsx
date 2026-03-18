import { GithubOutlined } from '@ant-design/icons';
import { DefaultFooter } from '@ant-design/pro-components';
import React from 'react';

const Footer: React.FC = () => {
  return (
    <DefaultFooter
      style={{
        background: 'none',
      }}
      links={[
        {
          key: 'GoHAM',
          title: 'GoHAM',
          href: 'https://github.com/icecliffs/GoHAM',
          blankTarget: true,
        },
        {
          key: 'github',
          title: <GithubOutlined />,
          href: 'https://github.com/icecliffs/GoHAM',
          blankTarget: true,
        },
        {
          key: 'IceCliffs',
          title: 'IceCliffs',
          href: 'https://iloli.moe',
          blankTarget: true,
        },
      ]}
    />
  );
};

export default Footer;
