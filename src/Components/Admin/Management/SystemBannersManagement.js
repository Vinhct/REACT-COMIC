import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Spinner, Alert, Badge, Image } from 'react-bootstrap';
import { supabase } from '../../../supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import AdminLayout from '../AdminLayout';

const SystemBannersManagement = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editBanner, setEditBanner] = useState(null);
  const [form, setForm] = useState({
    image_url: '',
    link: '',
    alt: '',
    position: 'top',
    active: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('system_banners')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setBanners(data);
    setLoading(false);
  };

  const handleShowModal = (banner = null) => {
    setEditBanner(banner);
    setForm(banner ? {
      image_url: banner.image_url || '',
      link: banner.link || '',
      alt: banner.alt || '',
      position: banner.position || 'top',
      active: banner.active
    } : {
      image_url: '', link: '', alt: '', position: 'top', active: true
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditBanner(null);
    setForm({ image_url: '', link: '', alt: '', position: 'top', active: true });
  };

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    if (editBanner) {
      // Update
      const { error } = await supabase
        .from('system_banners')
        .update(form)
        .eq('id', editBanner.id);
      if (error) setError(error.message);
    } else {
      // Insert
      const { error } = await supabase
        .from('system_banners')
        .insert([form]);
      if (error) setError(error.message);
    }
    setSaving(false);
    handleCloseModal();
    fetchBanners();
  };

  const handleDelete = async (banner) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa banner này?')) return;
    setSaving(true);
    const { error } = await supabase
      .from('system_banners')
      .delete()
      .eq('id', banner.id);
    if (error) setError(error.message);
    setSaving(false);
    fetchBanners();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    setSaving(true);
    const { data, error } = await supabase.storage
      .from('banners')
      .upload(fileName, file, { upsert: true });
    if (error) {
      setError('Lỗi upload ảnh: ' + error.message);
      setSaving(false);
      return;
    }
    // Lấy public URL
    const { data: publicUrlData } = supabase.storage
      .from('banners')
      .getPublicUrl(fileName);
    setForm(f => ({ ...f, image_url: publicUrlData.publicUrl }));
    setSaving(false);
  };

  return (
    <AdminLayout title="Quản lý Banner Hệ Thống">
      <div className="p-4">
        <h2>Quản lý Banner Hệ Thống</h2>
        {error && <Alert variant="danger">{error}</Alert>}
        <Button className="mb-3" onClick={() => handleShowModal()}>Thêm banner mới</Button>
        {loading ? <Spinner animation="border" /> : (
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Ảnh</th>
                <th>Link</th>
                <th>Vị trí</th>
                <th>Trạng thái</th>
                <th>Alt</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {banners.map(banner => (
                <tr key={banner.id}>
                  <td>{banner.image_url && <Image src={banner.image_url} alt={banner.alt} style={{maxWidth:80}} />}</td>
                  <td>{banner.link ? <a href={banner.link} target="_blank" rel="noopener noreferrer">Link</a> : '-'}</td>
                  <td>{banner.position}</td>
                  <td>{banner.active ? <Badge bg="success">Active</Badge> : <Badge bg="secondary">Inactive</Badge>}</td>
                  <td>{banner.alt}</td>
                  <td>{banner.created_at ? new Date(banner.created_at).toLocaleString() : '-'}</td>
                  <td>
                    <Button size="sm" variant="info" className="me-2" onClick={() => handleShowModal(banner)}>Sửa</Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(banner)}>Xóa</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <Modal show={showModal} onHide={handleCloseModal} centered>
          <Modal.Header closeButton>
            <Modal.Title>{editBanner ? 'Sửa banner' : 'Thêm banner mới'}</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Ảnh banner (upload từ máy tính)</Form.Label>
                <Form.Control type="file" accept="image/*" onChange={handleFileChange} disabled={saving} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Hoặc nhập URL ảnh</Form.Label>
                <Form.Control type="text" name="image_url" value={form.image_url} onChange={handleChange} required placeholder="https://..." />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Link (tùy chọn)</Form.Label>
                <Form.Control type="text" name="link" value={form.link} onChange={handleChange} placeholder="https://..." />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Alt (mô tả ảnh, tùy chọn)</Form.Label>
                <Form.Control type="text" name="alt" value={form.alt} onChange={handleChange} placeholder="Mô tả ảnh" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Vị trí</Form.Label>
                <Form.Select name="position" value={form.position} onChange={handleChange} required>
                  <option value="top">Top</option>
                  <option value="sidebar">Sidebar</option>
                  <option value="bottom">Bottom</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Check type="checkbox" name="active" checked={form.active} onChange={handleChange} label="Kích hoạt (hiển thị)" />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseModal}>Hủy</Button>
              <Button type="submit" variant="primary" disabled={saving}>{editBanner ? 'Lưu' : 'Thêm'}</Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default SystemBannersManagement; 