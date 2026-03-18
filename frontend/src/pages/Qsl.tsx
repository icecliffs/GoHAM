"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { PageContainer, ProCard } from "@ant-design/pro-components"
import { Upload, message, Modal, Empty, Card, Row, Col, Typography, Spin, Popconfirm } from "antd"
import { InboxOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons"
import type { UploadFile, UploadProps } from "antd/es/upload/interface"
import { deleteQSL, getAllQSL, uploadQSL } from "@/services/hamlog/api"

const { Dragger } = Upload
const { Title, Text } = Typography

interface QslCard {
    id: string
    url: string
    name: string
    uploadTime: string
}

const Qsl: React.FC = () => {
    const [fileList, setFileList] = useState<UploadFile[]>([])
    const [qslCards, setQslCards] = useState<QslCard[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [previewVisible, setPreviewVisible] = useState<boolean>(false)
    const [previewImage, setPreviewImage] = useState<string>("")
    const [previewTitle, setPreviewTitle] = useState<string>("")

    useEffect(() => {
        const fetchQslCards = async () => {
        setLoading(true)
            try {
                const response = await getAllQSL();
                setQslCards(Array.isArray(response.data) ? response.data : [])
            } catch (error) {
                message.error("Failed to fetch QSL cards")
                console.error(error)
            } finally {
                setLoading(false)
            }
        }

        fetchQslCards()
    }, [])


    const handleDelete = async (id: string) => {
        setLoading(true)
        try {
            await deleteQSL(id)
            setQslCards((prev) => prev.filter((card) => card.id !== id))
            message.success("QSL卡删除成功")
        } catch (error: any) {
            message.error(`删除失败：${error.message}`)
            console.error("删除错误：", error)
        } finally {
            setLoading(false)
        }
    }

    const handlePreview = async (card: QslCard) => {
        setPreviewImage(card.url)
        setPreviewVisible(true)
        setPreviewTitle(card.name)
    }

    const handleCancel = () => setPreviewVisible(false)

    const uploadProps: UploadProps = {
    name: "file",
    multiple: true,
    fileList,
    customRequest: async ({ file, onSuccess, onError }) => {
        try {
        const res = await uploadQSL(file as File);
        onSuccess?.(res as any, file as any);
        } catch (err) {
        console.error("上传失败：", err);
        onError?.(err as Error);
        }
    },
    onChange(info) {
        const { status } = info.file;
        setFileList(info.fileList);

        if (status === "done") {
        message.success(`${info.file.name} 上传成功`);
        const newCard: QslCard = {
            id: Date.now().toString(),
            url: info.file.response?.url || "/placeholder.svg?height=300&width=500",
            name: info.file.name,
            uploadTime: new Date().toLocaleString(),
        };
        setQslCards([...qslCards, newCard]);
        setFileList([]);
        } else if (status === "error") {
        message.error(`${info.file.name} 上传失败`);
        }
    },
    beforeUpload: (file) => {
        const isImage = file.type.startsWith("image/");
        if (!isImage) {
        message.error(`${file.name} 不是图片文件`);
        }
        return isImage || Upload.LIST_IGNORE;
    },
    };


    return (
        <PageContainer
            ghost
            header={{
                title: "QSL卡片管理",
            }}
        >
        <ProCard gutter={16} split="vertical">
            <ProCard title="上传QSL卡片" colSpan="100%">
                <Dragger {...uploadProps}>
                    <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                    </p>
                    <p className="ant-upload-text"></p>
                    <p className="ant-upload-hint">
                    支持单个或批量上传QSL卡片，点击或拖拽文件到此区域进行上传。
                    </p>
                </Dragger>
            </ProCard>
        </ProCard>
        <ProCard title="我的QSL卡片" colSpan="100%" className="mt-4" headerBordered>
            <Spin spinning={loading}>
                {qslCards.length > 0 ? (
                <Row gutter={[16, 16]}>
                    {qslCards.map((card) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={card.id}>
                        <Card
                        hoverable
                        cover={
                            <img
                            alt={card.name}
                            src={card.url || "/placeholder.svg"}
                            style={{ height: 200, objectFit: "cover" }}
                            />
                        }
                        actions={[
                            <EyeOutlined key="view" onClick={() => handlePreview(card)} />,
                            <Popconfirm
                            key={`popconfirm-${card.id}`}
                                title="你确定要删除这张QSL卡吗？"
                                onConfirm={() => handleDelete(card.id)}
                                okText="是的"
                                cancelText="不，我再想想"
                            >
                            <DeleteOutlined key="delete" />
                            </Popconfirm>,
                        ]}
                        >
                        <Card.Meta
                            title={card.name}
                            description={<Text type="secondary">上传时间: {card.upload_time}</Text>}
                        />
                        </Card>
                    </Col>
                    ))}
                </Row>
                ) : (
                <Empty description="当前还没有QSL卡片" />
                )}
            </Spin>
        </ProCard>
        <Modal visible={previewVisible} title={previewTitle} footer={null} onCancel={handleCancel}>
            <img alt={previewTitle} style={{ width: "100%" }} src={previewImage || "/placeholder.svg"} />
        </Modal>
        </PageContainer>
    )
}

export default Qsl;