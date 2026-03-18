import { login } from '@/services/hamlog/api';
import {
    AlipayCircleOutlined,
    LockOutlined,
    MobileOutlined,
    TaobaoCircleOutlined,
    UserOutlined,
    WeiboCircleOutlined,
} from '@ant-design/icons';
import {
    LoginForm,
    ProConfigProvider,
    ProFormCaptcha,
    ProFormCheckbox,
    ProFormText,
    setAlpha,
} from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { Space, Tabs, message, theme } from 'antd';
import { useState } from 'react';
import { flushSync } from 'react-dom';
type LoginType = 'phone' | 'account';

export default () => {
    const { initialState, setInitialState } = useModel('@@initialState');
    const [userLoginState, setUserLoginState] = useState<any>({});
    const fetchUserInfo = async () => {
        const userInfo = await initialState?.fetchUserInfo?.();
        console.log(userInfo);
        if (userInfo) {
            flushSync(() => {
                setInitialState((s) => ({
                    ...s,
                    currentUser: userInfo,
                }));
            });
        }
    };
    const handleSubmit = async (values: any) => {
        try {
        // 登录
        const type: LoginType = 'account';
        const msg = await login({ ...values, type });
        if (msg.code === 200) {
            message.success("登录成功");
            localStorage.setItem("token", msg.data.token);
            window.location.href = "/log";
            await fetchUserInfo();
            return;
        }
        setUserLoginState(msg);
        } catch (error) {
            message.error(error);
        }
    };
    const { status, type: loginType } = userLoginState;
    const { token } = theme.useToken();
    return (
    <ProConfigProvider hashed={false}>
        <div
            style={{
            backgroundColor: token.colorBgContainer,
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            }}
        >
            <LoginForm
            logo="/favicon.ico"
            title="GoHAM"
            subTitle="世界上最好用的无线电日志记录器！"
            onFinish={async (values) => {
                await handleSubmit(values as any);
            }}
            >
            <ProFormText
                name="username"
                fieldProps={{
                size: 'large',
                prefix: <UserOutlined className={'prefixIcon'} />,
                }}
                placeholder={'请输入用户名'}
                rules={[
                {
                    required: true,
                    message: '请输入用户名!',
                },
                ]}
            />
            <ProFormText.Password
                name="otp"
                placeholder={'请输入OTP代码'}
                rules={[
                {
                    required: true,
                    message: '请输入密码！',
                },
                ]}
            />
            </LoginForm>
        </div>
    </ProConfigProvider>
    );
};