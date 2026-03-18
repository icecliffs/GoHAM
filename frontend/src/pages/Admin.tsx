import React, { useState, useRef } from 'react';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined,
  UserOutlined,
  SearchOutlined
} from '@ant-design/icons';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { 
  ProTable, 
  PageContainer, 
  ModalForm, 
  ProForm, 
  ProFormText,
  ProFormSelect,
  ProFormRadio,
  ProFormTextArea
} from '@ant-design/pro-components';
import { 
  Button, 
  message, 
  Modal, 
  Space, 
  Tag, 
  Input,
  Avatar,
  Popconfirm 
} from 'antd';
import { useIntl } from 'umi';
import { 
  getAllUsers, 
  addUser, 
  deleteUser, 
  updateUser,
  getUserLogs,
  deleteUserLog,
  generateOTP,
  userRegister
} from '@/services/hamlog/api';

const AdminPage: React.FC = () => {
  const intl = useIntl();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<API.User | undefined>(undefined);
  const [logModalVisible, setLogModalVisible] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const userActionRef = useRef<ActionType>();
  const logActionRef = useRef<ActionType>();
  const formRef = useRef<any>();
  // 用户状态枚举
  const statusEnum = {
    active: { text: <Tag color="success">活跃</Tag> },
    inactive: { text: <Tag color="error">禁用</Tag> },
    pending: { text: <Tag color="processing">待激活</Tag> },
  };

  // 用户角色枚举
  const roleEnum = {
    admin: { text: <Tag color="red">管理员</Tag> },
    user: { text: <Tag color="blue">普通用户</Tag> },
    guest: { text: <Tag color="default">游客</Tag> },
  };

  // 用户表格列定义
  const userColumns: ProColumns<API.User>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 48,
      hideInSearch: true,
    },
    {
      title: '头像',
      dataIndex: 'avatar',
      hideInSearch: true,
      render: (_, record) => (
        <Avatar 
          src={record.avatar || `https://robohash.org/${record.username}`} 
          icon={<UserOutlined />} 
        />
      ),
    },
    {
      title: '用户名',
      hideInSearch: true,
      dataIndex: 'username',
      render: (_, record) => (
        <a onClick={() => {
          setCurrentUser(record);
          setModalVisible(true);
        }}>
          {record.username}
        </a>
      ),
    },
    {
      title: '呼号',
      hideInSearch: true,
      dataIndex: 'callsign',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      hideInSearch: true,
    },
    {
      title: '操作',
      valueType: 'option',
      render: (text, record, _, action) => [
        <a
          key="logs"
          onClick={() => {
            setSelectedUserId(record.id);
            setLogModalVisible(true);
          }}
        >
          <SearchOutlined /> 日志
        </a>,
        <Popconfirm
          key="delete"
          title="确定要删除此用户吗？"
          onConfirm={async () => {
            await deleteUser(record.id);
            message.success('用户删除成功');
            action?.reload();
          }}
        >
          <a style={{ color: '#ff4d4f' }}>
            <DeleteOutlined /> 删除
          </a>
        </Popconfirm>,
      ],
    },
  ];

  // 用户日志表格列定义
  const logColumns: ProColumns<API.Log>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 48,
    },
    {
      title: '时间',
      dataIndex: 'date',
      valueType: 'dateTime',
    },
    {
      title: '呼号',
      dataIndex: 'fromsign',
    },
    {
      title: '对方呼号',
      dataIndex: 'tosign',
    },
    {
      title: '频率',
      dataIndex: 'frequency',
    },
    {
      title: '模式',
      dataIndex: 'method',
      render: (_, record) => {
        const colorMap: Record<string, string> = {
          AM: 'red',
          FM: 'yellow',
          USB: 'blue',
          LSB: 'green',
          CW: 'pink',
          RTTY: 'volcano',
          FT8: 'orange'
        };
        return <Tag color={colorMap[record.method]}>{record.method}</Tag>;
      },
    }
  ];

  // 处理用户表单提交
  const handleUserSubmit = async (values: API.User) => {
    try {
      if (currentUser?.id) {
        // 更新用户
        await updateUser(currentUser.id, values);
        message.success('用户更新成功');
      } else {
        // 创建用户
        await addUser(values);
        message.success('用户创建成功');
      }
      setModalVisible(false);
      userActionRef.current?.reload();
      return true;
    } catch (error) {
      message.error('操作失败，请重试');
      return false;
    }
  };

  return (
    <PageContainer>
        <ProTable<API.User>
          headerTitle="用户管理"
          actionRef={userActionRef}
          columns={userColumns}
          request={getAllUsers}
          rowKey="id"
          search={false}
          toolBarRender={() => [
            <Button
          key="button"
          icon={<PlusOutlined />}
          type="primary"
          onClick={() => {
            setCurrentUser(undefined);
            setModalVisible(true);
          }}
            >
          新建用户
            </Button>,
          ]}
        />
      <ModalForm<API.User>
        title={currentUser ? '编辑用户' : '新建用户'}
        width="600px"
        formRef={formRef}
        visible={modalVisible}
        onVisibleChange={setModalVisible}
        onFinish={handleUserSubmit}
        submitter={false}
      >
        <ProForm.Group>
          <ProFormText
            width="md"
            name="username"
            label="用户名"
            placeholder="请输入用户名"
            rules={[{ required: true, message: '请输入用户名!' }]}
          />
          <ProFormText
            width="md"
            name="callsign"
            label="呼号"
            placeholder="请输入呼号"
          />
        </ProForm.Group>

        <ProForm.Group>
          <ProFormText
            width="md"
            name="email"
            label="邮箱"
            placeholder="请输入邮箱"
            rules={[
              { required: true, message: '请输入邮箱!' },
              { type: 'email', message: '请输入有效的邮箱地址!' },
            ]}
          />
          <ProFormText
            width="md"
            name="data"
            label="OTP"
            placeholder="点击生成获取OTP"
            rules={[{ required: true, message: '请输入OTP!' }]}
          />
          <Button
            type="default"
            onClick={async () => {
              const values = await formRef.current?.validateFields(['username', 'email']);
              const email = formRef.current?.getFieldValue('email');
              if (!values?.username || !values?.email) {
                message.warning('请先输入用户名和邮箱');
                return;
              }
              try {
                const res = await generateOTP(email);
                if (res?.code === 200 && res.data) {
                  formRef.current?.setFieldsValue({ data: res.data });
                  message.success('OTP生成成功');
                } else {
                  message.error(res?.message || 'OTP生成失败');
                }
              } catch (err) {
                message.error('OTP请求失败');
              }
            }}
            style={{ marginLeft: 8, marginTop: 30 }}
          >
            生成 OTP
          </Button>
        </ProForm.Group>
        <Button
          type="primary"
          onClick={async () => {
            const values = await formRef.current?.validateFields();
            try {
              await userRegister({
                username: values.username,
                email: values.email,
                callsign: values.callsign,
                otp: values.data,
              });
              message.success('用户注册成功');
              setModalVisible(false);
              userActionRef.current?.reload();
            } catch (err) {
              message.error('用户注册失败');
            }
          }}
        >
          注册用户
        </Button>
      </ModalForm>


      {/* 用户日志管理模态框 */}
      <Modal
        title="用户日志管理"
        width="80%"
        // 不要有搜索
        visible={logModalVisible}
        onCancel={() => setLogModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <ProTable<API.Log>
          actionRef={logActionRef}
          search={false}
          columns={logColumns}
          request={async (params, sort, filter) => {
            if (!selectedUserId) return { data: [], success: true };
            const response = await getUserLogs(selectedUserId);
            return {
              data: response.data || [],
              success: response.code === 200,
            };
          }}
          rowKey="id"
          pagination={{
            pageSize: 10,
          }}
        />
      </Modal>
    </PageContainer>
  );
};

export default AdminPage;