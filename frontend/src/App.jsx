import { useEffect, useState } from 'react';

function App() {
  const [resources, setResources] = useState([]);
  const [form, setForm] = useState({ name: '', total: '' });
  const [requestForm, setRequestForm] = useState({ resourceId: '', amount: '' });
  const [publishErrors, setPublishErrors] = useState({ name: '', total: '' });
  const [requestErrors, setRequestErrors] = useState({ resourceId: '', amount: '' });
  const [status, setStatus] = useState({ type: '', message: '' });

  // 初始化时从 localStorage 加载资源，或使用模拟数据
  useEffect(() => {
    const savedResources = JSON.parse(localStorage.getItem('resources'));
    if (savedResources && savedResources.length > 0) {
      setResources(savedResources);
    } else {
      const mockResources = [
        { id: '1', name: '资源1', total: '1000', remaining: '1000' },
        { id: '2', name: '资源2', total: '1000', remaining: '1000' },
        { id: '3', name: '资源3', total: '1000', remaining: '1000' },
      ];
      setResources(mockResources);
      localStorage.setItem('resources', JSON.stringify(mockResources));
    }
  }, []);

  // 资源变化时保存到 localStorage
  useEffect(() => {
    localStorage.setItem('resources', JSON.stringify(resources));
  }, [resources]);

  // 状态消息显示后3秒自动消失
  useEffect(() => {
    if (status.message) {
      const timer = setTimeout(() => setStatus({ type: '', message: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  // 处理发布资源表单提交
  const handleSubmitResource = () => {
    let errors = { name: '', total: '' };
    if (!form.name) {
      errors.name = '资源名称不能为空';
    }
    if (!form.total || isNaN(parseInt(form.total)) || parseInt(form.total) <= 0) {
      errors.total = '资源总量必须是正整数';
    }
    if (errors.name || errors.total) {
      setPublishErrors(errors);
      return;
    }
    setPublishErrors({ name: '', total: '' });
    const newResource = {
      id: String(resources.length + 1),
      name: form.name,
      total: form.total,
      remaining: form.total,
    };
    setResources([...resources, newResource]);
    setForm({ name: '', total: '' });
    setStatus({ type: 'success', message: '资源发布成功 ✅' });
  };

  // 处理请求资源表单提交
  const handleRequestSubmit = () => {
    let errors = { resourceId: '', amount: '' };
    if (!requestForm.resourceId) {
      errors.resourceId = '请选择资源';
    }
    const amount = parseInt(requestForm.amount);
    if (!requestForm.amount || isNaN(amount) || amount <= 0) {
      errors.amount = '请求数量必须是正整数';
    }
    if (errors.resourceId || errors.amount) {
      setRequestErrors(errors);
      return;
    }
    const resource = resources.find((res) => res.id === requestForm.resourceId);
    if (parseInt(resource.remaining) < amount) {
      setRequestErrors({ ...requestErrors, amount: '请求数量超过剩余量' });
      return;
    }
    setRequestErrors({ resourceId: '', amount: '' });
    const updatedResources = resources.map((res) => {
      if (res.id === requestForm.resourceId) {
        return { ...res, remaining: String(parseInt(res.remaining) - amount) };
      }
      return res;
    });
    setResources(updatedResources);
    setRequestForm({ resourceId: '', amount: '' });
    setStatus({ type: 'success', message: '请求成功 ✅' });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* 状态消息提示 */}
      {status.message && (
        <div
          className={`fixed top-0 left-0 right-0 p-4 text-center ${
            status.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {status.message}
        </div>
      )}
      <h1 className="text-4xl font-bold text-center mb-10">资源可信共享平台</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 发布资源 */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
          <h2 className="text-3xl font-semibold mb-6">发布资源 📦</h2>
          <input
            type="text"
            placeholder="资源名称"
            className={`w-full p-3 mb-4 rounded-lg border-2 ${
              publishErrors.name ? 'border-red-500' : 'border-gray-700'
            } bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-teal-500`}
            value={form.name}
            onChange={(e) => {
              setForm({ ...form, name: e.target.value });
              setPublishErrors({ ...publishErrors, name: '' });
            }}
          />
          {publishErrors.name && (
            <p className="text-red-500 text-sm mb-2">{publishErrors.name}</p>
          )}
          <input
            type="number"
            placeholder="资源总量"
            className={`w-full p-3 mb-6 rounded-lg border-2 ${
              publishErrors.total ? 'border-red-500' : 'border-gray-700'
            } bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-teal-500`}
            value={form.total}
            onChange={(e) => {
              setForm({ ...form, total: e.target.value });
              setPublishErrors({ ...publishErrors, total: '' });
            }}
          />
          {publishErrors.total && (
            <p className="text-red-500 text-sm mb-2">{publishErrors.total}</p>
          )}
          <button
            className="w-full py-3 bg-teal-600 text-xl font-semibold rounded-lg transition hover:bg-teal-500"
            onClick={handleSubmitResource}
          >
            发布资源
          </button>
        </div>
        {/* 请求资源 */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
          <h2 className="text-3xl font-semibold mb-6">请求资源 🛒</h2>
          <select
            className={`w-full p-3 mb-4 rounded-lg border-2 ${
              requestErrors.resourceId ? 'border-red-500' : 'border-gray-700'
            } bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-teal-500`}
            value={requestForm.resourceId}
            onChange={(e) => {
              setRequestForm({ ...requestForm, resourceId: e.target.value });
              setRequestErrors({ ...requestErrors, resourceId: '' });
            }}
          >
            <option value="">选择资源</option>
            {resources.map((res) => (
              <option key={res.id} value={res.id}>
                {res.name} (ID: {res.id}, 剩余: {res.remaining})
              </option>
            ))}
          </select>
          {requestErrors.resourceId && (
            <p className="text-red-500 text-sm mb-2">{requestErrors.resourceId}</p>
          )}
          {requestForm.resourceId && (
            <p className="text-sm text-gray-400 mb-2">
              当前资源剩余:{' '}
              {resources.find((res) => res.id === requestForm.resourceId).remaining}
            </p>
          )}
          <input
            type="number"
            placeholder="请求数量"
            className={`w-full p-3 mb-6 rounded-lg border-2 ${
              requestErrors.amount ? 'border-red-500' : 'border-gray-700'
            } bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-teal-500`}
            value={requestForm.amount}
            onChange={(e) => {
              setRequestForm({ ...requestForm, amount: e.target.value });
              setRequestErrors({ ...requestErrors, amount: '' });
            }}
          />
          {requestErrors.amount && (
            <p className="text-red-500 text-sm mb-2">{requestErrors.amount}</p>
          )}
          <button
            className="w-full py-3 bg-teal-600 text-xl font-semibold rounded-lg transition hover:bg-teal-500"
            onClick={handleRequestSubmit}
          >
            发起请求
          </button>
        </div>
      </div>
      {/* 市场概览 */}
      <div className="mt-10 bg-gray-800 p-6 rounded-lg shadow-xl">
        <h2 className="text-3xl font-semibold mb-6">市场概览 📊</h2>
        <table className="w-full text-left text-lg">
          <thead>
            <tr>
              <th className="p-3 text-teal-600">资源名称</th>
              <th className="p-3 text-teal-600">总量</th>
              <th className="p-3 text-teal-600">剩余量</th>
              <th className="p-3 text-teal-600">状态</th>
            </tr>
          </thead>
          <tbody>
            {resources.map((res) => (
              <tr key={res.id} className="border-t border-gray-700 hover:bg-gray-700">
                <td className="p-3">{res.name}</td>
                <td className="p-3">{res.total}</td>
                <td className="p-3">{res.remaining}</td>
                <td className="p-3">{parseInt(res.remaining) > 0 ? '可用' : '已过期'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;