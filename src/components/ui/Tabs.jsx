import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";

export default function EmailTabs({ category, setCategory }) {
  const categories = [
    { id: "Inbox", name: "Входящие" },
    { id: "Sent", name: "Отправленные" },
    { id: "Drafts", name: "Черновики" },
    { id: "Trash", name: "Корзина" },
  ];

  return (
    <Tabs selectedIndex={categories.findIndex(c => c.id === category)} onSelect={(index) => setCategory(categories[index].id)}>
      <TabList>
        {categories.map((cat) => (
          <Tab key={cat.id}>{cat.name}</Tab>
        ))}
      </TabList>
    </Tabs>
  );
}
