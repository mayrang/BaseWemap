import { Layout } from "antd";

const { Content } = Layout;

const MainLayout = ({ children, style, navBarfullSize = true }) => {
  return (
    <Layout className="layout-bg relative min-h-screen">
      <Content className={"p-10"} style={style}>
        <div className="rounded-md border-2 bg-white p-4 shadow-md">
          {children}
        </div>
      </Content>
    </Layout>
  );
};

export default MainLayout;
